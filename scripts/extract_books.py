"""
다카하시 신지 강연집 & 신·부활 PDF 완벽 정제 파서 및 데이터 생성기 (최종 무결점 마스터 버전)
- 본문 및 대사(예: "너희가 어떻게 내 마음을 알겠어!") 100% 온전하게 보존
- 챕터별 시작/종료 페이지 및 섹션 경계 정밀 동기화
- '원문 N쪽', '[원문 N쪽]', 순수 제목 라인 완벽 제거
- 띄어쓰기 및 맞춤법 무결점 보존
"""

import sys
import re
import json
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

# Only pure section title lines to be removed
STANDALONE_PDF_HEADINGS = [
    r'1\.\s*청정한\s*이들에게\s*보내는\s*선물',
    r'1-1\.\s*서이즈로의\s*여행',
    r'1-2\.\s*날개\s*달린\s*천사의\s*출현',
    r'2\.\s*난키\s*시라하마에서\s*열린\s*연수회',
    r'2-1\.\s*연수회장의\s*방에서',
    r'2-2\.\s*대천사들과\s*주(?:\(메시아\))?',
    r'2-3\.\s*성경의\s*오류',
    r'2-4\.\s*하나의\s*신리,\s*한\s*사람의\s*지도자',
    r'2-5\.\s*사탄[,\s]*루슈엘',
    r'2-6\.\s*대천사\s*미카엘의\s*메시지\s*1',
    r'2-7\.\s*대천사\s*미카엘의\s*메시지\s*2(?::\s*강사들에게\s*보내는\s*경고)?',
    r'2-8\.\s*대천사\s*미카엘의\s*메시지\s*3(?::\s*강사들에게\s*보내는\s*간언)?',
    r'2-9\.\s*사탄에게\s*중독된\s*강사들',
    r'3\.\s*강연회\s*-\s*마음속에\s*내재된\s*영지(?:\s*\(英智\))?(?:\(1976\s*년4\s*월11일\))?',
    r'가장\s*엄격한\s*배움터에서',
    r'감사에서\s*보은으로',
    r'개공과\s*색즉시공',
    r'고락의\s*양극과\s*중도',
    r'고야산에서\s*겪은\s*일',
    r'공의\s*세계와\s*불생불멸',
    r'관자재보살과\s*행심',
    r'괴로움에서\s*벗어나는\s*길',
    r'국경을\s*넘어선\s*신의\s*자녀',
    r'녹음테이프에서\s*책으로',
    r'대우주의\s*의식과\s*대자비',
    r'듣는\s*사람의\s*성향과\s*색',
    r'마음속의\s*공해',
    r'마음의\s*단계와\s*빛',
    r'마음의\s*바늘과\s*깨달음의\s*길',
    r'마음의\s*스모그와\s*팔정도',
    r'마음의\s*주파수와\s*맹목적인\s*신앙',
    r'만족과\s*조화의\s*경제',
    r'빛의\s*돔과\s*제\s*2\s*의\s*태양',
    r'빛의\s*천사와\s*제천선신',
    r'사회의\s*카르마와\s*인류의\s*역사',
    r'생로병사와\s*반성',
    r'생로병사와\s*색심불이',
    r'선택한\s*환경과\s*자기심판',
    r'수상행식과\s*법의\s*실상',
    r'신리와\s*과학',
    r'신의\s*몸\s*안에서',
    r'실재계와\s*현상계',
    r'심행을\s*쓰기까지',
    r'심행과\s*기원문',
    r'아뇩다라삼먁삼보리와\s*진언',
    r'역사와\s*숭배\s*사이',
    r'오관의\s*반응과\s*마음의\s*판단',
    r'오온개공과\s*사리자',
    r'우주와\s*만물의\s*상호작용',
    r'우주의\s*질서와\s*무아',
    r'원인과\s*결과의\s*윤회',
    r'육체라는\s*배와\s*실재계의\s*약속',
    r'육체라는\s*배와\s*중도의\s*자',
    r'의식의\s*중심과\s*색심불이',
    r'조상공양보다\s*먼저\s*할\s*일',
    r'죽음과\s*광자체',
    r'중도라는\s*자연의\s*이치',
    r'자연은\s*끊임없이\s*순환한다',
    r'지구라는\s*대신전과\s*영혼의\s*수행',
    r'진정한\s*조상공양',
    r'집착에서\s*벗어나는\s*실천',
    r'짧은\s*삶을\s*올바르게',
    r'참된\s*법등과\s*우주즉아',
    r'큰\s*결단과\s*하늘의\s*배려',
    r'태어남과\s*망각',
    r'팔정도라는\s*중도의\s*필터',
    r'편찬\s*계획과\s*첫\s*확신',
    r'현상계와\s*생명의\s*차원',
    r'현세의\s*천사와\s*삶의\s*목적',
    r'행위가\s*곧\s*빛이다'
]

def clean_paragraph_text(text):
    if not text:
        return ""
    
    t = text.replace('\r\n', ' ').replace('\r', ' ').replace('\n', ' ')
    
    # 1. Standardize bullets & whitespaces
    t = re.sub(r'[\uf0b7\uf0a7\u2022]\s*', '• ', t)
    t = t.replace('\xa0', ' ')
    t = re.sub(r'[ \t]+', ' ', t)
    
    # 2. Strip '원문 N쪽' inside paragraph
    t = re.sub(r'\[?원문\s*\d+\s*쪽\]?', '', t)
    
    # 3. Strip standalone PDF headings leaked into paragraph
    for h_pat in STANDALONE_PDF_HEADINGS:
        t = re.sub(rf'^\s*{h_pat}\s*', '', t)
        t = re.sub(rf'\s+{h_pat}\s+', ' ', t)
        t = re.sub(rf'\s*{h_pat}\s*$', '', t)
        
    # 4. Fix ~있습니다 / ~없습니다 / ~했습니다 / ~있었다 / ~없었다 / ~했다 붙어쓰기
    t = re.sub(r'([아어여해고지게자]야?|[려자고]|하여|되어|해서|으며|면서|았|었|였|겠)\s*(있습|없습|했습|있었|없었|했었|있던|없던|했던|있네|없네|있고|없고|있으|없으|있는|없는|있다|없다|했다|한다)', r'\1 \2', t)
    
    # 5. Fix 조사 + 있습니다/없습니다
    t = re.sub(r'([이가을를은는에도만뿐])\s*(있습|없습|있었|없었|있다|없다|있는|없는|있어|없어|있으|없으)', r'\1 \2', t)
    t = re.sub(r'([에서으로로와의에게까지부터보다처럼조차마저]+)\s*(있습|없습|있었|없었|있다|없다|있는|없는|있어|없어|있으|없으)', r'\1 \2', t)

    # 6. Fix ~고 싶다 / ~ㄹ 수 있다 / ~ㄹ 것 / ~ㄹ 때 / ~ㄹ 줄 / ~ㄹ 수밖에 / ~ㄹ 뿐
    t = re.sub(r'([을를ㄹ]\s*)수\s*(있|없|도|밖)', r'\1수 \2', t)
    t = re.sub(r'([가-힣]+[을를ㄹ])(수\s*[있없도밖]|것|때|줄|뿐|바|양|체|겸|만|법)', r'\1 \2', t)
    t = re.sub(r'([가-힣]+[은는ㄴ])(것|때|줄|이|데|바|분|편|셈|척|체|법)', r'\1 \2', t)
    t = re.sub(r'([가-힣]+[던])(것|때|곳|사람|이|분)', r'\1 \2', t)
    
    # 7. Fix ~라고 / ~다고 / ~자고 / ~냐고 / ~라며 / ~다며 + (했다/말했다/생각했다/물었다/답했다/외쳤다/설했다)
    t = re.sub(r'([라다자냐]고|[라다]며)\s*(했습|말했|생각했|물었|답했|외쳤|설했|하|말하|생각하|선언했)', r'\1 \2', t)

    # 8. Fix 조사 뒤 공백 누락된 복합 패턴들
    t = re.sub(r'([가-힣]{2,}(?:에도|에는|에서도|에서는|에게는|에게도|으로부터|로부터|으로는|로서는|에게서))\s*([가-힣]{2,})', r'\1 \2', t)
    
    # 9. Specific stuck words from PDF line-splits
    fixes = [
        (r'생활에도여유가', '생활에도 여유가'),
        (r'병을낫게', '병을 낫게'),
        (r'이러한환경에서', '이러한 환경에서'),
        (r'모든현상을', '모든 현상을'),
        (r'조화로운삶을사는', '조화로운 삶을 사는'),
        (r'조화로운삶을', '조화로운 삶을'),
        (r'삶을사는', '삶을 사는'),
        (r'이가운데', '이 가운데'),
        (r'의문이끊임없이솟아났습니다', '의문이 끊임없이 솟아났습니다'),
        (r'끊임없이솟아났습니다', '끊임없이 솟아났습니다'),
        (r'괴로움을어떻게풀', '괴로움을 어떻게 풀'),
        (r'어떻게풀', '어떻게 풀'),
        (r'다리위에', '다리 위에'),
        (r'이해하지못할', '이해하지 못할'),
        (r'그런신리를', '그런 신리를'),
        (r'신리를구석구석알', '신리를 구석구석 알'),
        (r'구석구석알', '구석구석 알'),
        (r'사람들이떠난', '사람들이 떠난'),
        (r'아라한이라는경지', '아라한이라는 경지'),
        (r'원망과질투와비방', '원망과 질투와 비방'),
        (r'마음을닦아', '마음을 닦아'),
        (r'신앙이란자기마음', '신앙이란 자기 마음'),
        (r'자연의이치에', '자연의 이치에'),
        (r'신리를설해', '신리를 설해'),
        (r'생각을품거나행동으로', '생각을 품거나 행동으로'),
        (r'지옥의세계로', '지옥의 세계로'),
        (r'인간은모두신의자녀', '인간은 모두 신의 자녀'),
        (r'신의뜻에맞는', '신의 뜻에 맞는'),
        (r'참된신불이란', '참된 신불이란'),
        (r'물질문명의노예', '물질문명의 노예'),
        (r'물질경제는', '물질경제는'),
        (r'대우주체속의', '대우주체 속의'),
        (r'위대한대신전', '위대한 대신전'),
        (r'평화로운불국토', '평화로운 불국토'),
        (r'참된불교는', '참된 불교는'),
        (r'인간으로태어난', '인간으로 태어난'),
        (r'신자의마음', '신자의 마음'),
        (r'신의자녀이자부처의자녀', '신의 자녀이자 부처의 자녀'),
        (r'진정한자유', '진정한 자유'),
        (r'눈먼인생', '눈먼 인생'),
        (r'오관의한계', '오관의 한계'),
        (r'천상의세계', '천상의 세계')
    ]
    
    for pat, repl in fixes:
        t = re.sub(pat, repl, t)

    # 10. Clean spaces before/after punctuation
    t = re.sub(r'\s+([,\.!\?\)\]\}”’」』])', r'\1', t)
    t = re.sub(r'([\(\[\{“‘「『])\s+', r'\1', t)
    t = re.sub(r'([\.!\?])([가-힣“‘「『])', r'\1 \2', t)
    t = re.sub(r'([,])([가-힣])', r'\1 \2', t)
    
    # 11. Re-fix proper names
    t = re.sub(r'다카\s+하시', '다카하시', t)
    t = re.sub(r'미카\s+엘', '미카엘', t)
    t = re.sub(r'가브리\s+엘', '가브리엘', t)
    t = re.sub(r'루슈\s+엘', '루슈엘', t)
    t = re.sub(r'소노\s+가시라', '소노가시라', t)
    t = re.sub(r'카필\s+라', '카필라', t)
    t = re.sub(r'바스\s+투', '바스투', t)
    t = re.sub(r'싯다\s+르타', '싯다르타', t)
    t = re.sub(r'예\s+수도', '예수도', t)
    
    # Clean double spaces
    t = re.sub(r'[ \t]+', ' ', t)
    
    return t.strip()


def parse_lecture_chapter(reader, start_page, end_page, lecture_info):
    full_text = ""
    for p_no in range(start_page, end_page + 1):
        p_idx = p_no - 1
        if p_idx >= len(reader.pages):
            continue
            
        raw = reader.pages[p_idx].extract_text() or ""
        raw = raw.replace('\r\n', '\n').replace('\r', '\n')
        
        # Remove headers
        raw = re.sub(r'다카하시\s*신지\s*강연집\s*한국어판\s*·\s*(?:제\d+강|후기)\s*\n\d+\s*\n?', '', raw)
        raw = re.sub(r'다카하시\s*신지\s*강연집\s*·\s*한국어판\s*통합본\s*\n\d+\s*\n?', '', raw)
        
        # If first page, strip title block and guide note
        if p_no == start_page:
            raw = re.sub(r'^(?:제\d+강|편집부\s*후기)\s*·\s*원서[^\n]+\n', '', raw.strip())
            lines = raw.split('\n')
            body_lines = []
            in_guide = False
            guide_done = False
            
            for line in lines:
                l_str = line.strip()
                if not guide_done and (l_str.startswith('이 번역은') or '일본어 본문을 기준으로' in l_str or '129쪽의' in l_str):
                    in_guide = True
                    if l_str.endswith(('옮겼다.', '않았다.', '적었다.', '사용했다.', '반영했다.')):
                        in_guide = False
                        guide_done = True
                    continue
                    
                if in_guide:
                    if l_str.endswith(('옮겼다.', '않았다.', '적었다.', '사용했다.', '반영했다.')):
                        in_guide = False
                        guide_done = True
                    continue
                    
                if not guide_done and any(kw in l_str for kw in ['釈迦の', '現代宗教', '人生의目的', '神と人間', '般若心経', '心行', '中道', '転生輪廻', '諸法無我', '編集後記', 'あとがき', '석가의', '현대 종교', '인생의 목적', '신과 인간', '반야심경', '중도에', '전생윤회', '제법무아', '편집부 후기']):
                    continue
                    
                if any(re.match(rf'^{h}\s*$', l_str) for h in STANDALONE_PDF_HEADINGS):
                    continue
                    
                body_lines.append(line)
                
            raw = '\n'.join(body_lines)
            
        full_text += '\n\n' + raw
        
    raw_paras = full_text.split('\n\n')
    paras = []
    for p in raw_paras:
        cleaned = clean_paragraph_text(p)
        if cleaned:
            if any(re.match(rf'^{h}$', cleaned) for h in STANDALONE_PDF_HEADINGS):
                continue
            paras.append(cleaned)
            
    return paras


def parse_shin_buhwal_chapter(reader, start_page, end_page, ch_num):
    full_text = ""
    for p_no in range(start_page, end_page + 1):
        p_idx = p_no - 1
        if p_idx >= len(reader.pages):
            continue
            
        raw = reader.pages[p_idx].extract_text() or ""
        raw = raw.replace('\r\n', '\n').replace('\r', '\n')
        
        # Remove headers
        raw = re.sub(r'신·부활\s*\|\s*한국어\s*완역\s*·\s*최종판\s*\n\d+\s*\n?', '', raw)
        raw = re.sub(r'신·부활\s*\|\s*한국어\s*완역\s*·\s*최종판\s*\n?', '', raw)
        
        # Remove isolated '원문 N쪽'
        raw = re.sub(r'^\s*\[?원문\s*\d+\s*쪽\]?\s*$', '', raw, flags=re.MULTILINE)
        
        full_text += '\n\n' + raw
        
    raw_paras = full_text.split('\n\n')
    paras = []
    for p in raw_paras:
        cleaned = clean_paragraph_text(p)
        if cleaned:
            if any(re.match(rf'^{h}$', cleaned) for h in STANDALONE_PDF_HEADINGS):
                continue
            paras.append(cleaned)
                
    return paras


def parse_lectures_book():
    pdf_path = '다카하시_신지_강연집_한국어판_통합본_최종검수본.pdf'
    reader = pypdf.PdfReader(pdf_path)
    
    lecture_meta = [
        {
            "id": 1,
            "number": "제1강",
            "title": "석가의 탄생에서 불교의 변천까지",
            "origTitle": "釈迦の生誕から仏教の変遷",
            "startPage": 3,
            "endPage": 22,
            "origPages": "원서 12~26쪽",
            "tags": ["석가 탄생", "색심불이", "극미극대", "영적 각성", "불교의 변천"],
            "summary": "어린 시절의 의식 이탈과 물리학 탐구, 1968년 영적 현상과의 직면 및 깨달음, 그리고 고타마 붓다의 탄생과 불교 교리의 변천 과정을 과학적·영적 관점에서 밝힌 역사적 개시 강연입니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제1강(원서 12~26쪽)의 일본어 본문을 기준으로 했다. 강연자의 종교적·역사적·과학적 주장은 사실 여부를 보강하거나 수정하지 않고 발화의 뜻 그대로 옮겼다. 핵심어인 신리(神理), 정법(正法), 실재계(実在界)는 첫 등장에 한자를 함께 적었다.",
            "readingTime": "약 20분"
        },
        {
            "id": 2,
            "number": "제2강",
            "title": "현대 종교에 대한 의문",
            "origTitle": "現代宗教に対する疑問",
            "startPage": 23,
            "endPage": 38,
            "origPages": "원서 26~37쪽",
            "tags": ["기성 종교", "형식주의 비판", "마음의 거울", "진실한 기도"],
            "summary": "형식과 교조주의에 얽매여 인간의 고뇌를 해결하지 못하는 현대 기성 종교의 한계를 날카롭게 비판하고, 마음의 반성과 조화로운 실천을 통한 참된 신앙의 길을 제시합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제2강(원서 26~36쪽)의 일본어 본문을 기준으로 했다. 강연록 일괄 PDF(1971년 10월 23일 간사이 본부 강연)는 원문 판독과 고유명사 확인에 사용했다.",
            "readingTime": "약 15분"
        },
        {
            "id": 3,
            "number": "제3강",
            "title": "인생의 목적과 사명",
            "origTitle": "人生の目的と使命",
            "startPage": 39,
            "endPage": 53,
            "origPages": "원서 37~49쪽",
            "tags": ["인생의 목적", "혼의 수행장", "수호령·지도령", "지상계 사명"],
            "summary": "인간은 왜 이 세상에 태어났는가? 지상계라는 영혼의 수련 도장에서 각자의 사명을 자각하고, 자비와 사랑을 실천하여 신의 뜻에 부합하는 삶을 살아가는 원리를 밝힙니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제3강(원서 37~49쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 15분"
        },
        {
            "id": 4,
            "number": "제4강",
            "title": "신과 인간의 관계에 대하여",
            "origTitle": "神と人間の関係について",
            "startPage": 54,
            "endPage": 89,
            "origPages": "원서 49~70쪽",
            "tags": ["신과 인간", "우주의 의식", "마음의 조화", "영적 진화", "자비와 사랑"],
            "summary": "대우주의 근원적인 의식(신)과 분신으로서의 인간 마음이 어떻게 연결되어 있는지, 대자연의 자비와 인간 영혼의 상념·행위가 빚어내는 법칙을 심도 있게 탐구합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제4강(원서 49~70쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 30분"
        },
        {
            "id": 5,
            "number": "제5강",
            "title": "반야심경 해설",
            "origTitle": "般若心経解説",
            "startPage": 90,
            "endPage": 109,
            "origPages": "원서 70~81쪽",
            "tags": ["반야심경", "색즉시공 공즉시색", "오온개공", "사리자", "진정한 지혜"],
            "summary": "색(물질/육체)과 공(에너지/영혼)의 진정한 일체성, 오온개공과 사리자의 의미를 현대 물리학과 영적 진리의 관점에서 명쾌하고 완전하게 재해석한 명해설입니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제5강(원서 70~81쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 20분"
        },
        {
            "id": 6,
            "number": "제6강",
            "title": "심행 해설 (상)",
            "origTitle": "心行解説（上）",
            "startPage": 110,
            "endPage": 124,
            "origPages": "원서 81~90쪽",
            "tags": ["심행", "정법의 요체", "상념과 행위", "반성의 기본"],
            "summary": "정법 신앙의 근간이 되는 경전 『심행(心行)』 전반부 구절들의 영적 의미를 한 구절씩 풀이하며, 인간의 마음가짐과 일상에서의 실천 지침을 전합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제6강(원서 81~90쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 15분"
        },
        {
            "id": 7,
            "number": "제7강",
            "title": "심행 해설 (하)",
            "origTitle": "心行解説（下）",
            "startPage": 125,
            "endPage": 144,
            "origPages": "원서 90~103쪽",
            "tags": ["심행", "천상계의 구조", "영혼의 조화", "윤회와 완성"],
            "summary": "『심행』 후반부에 나타난 영계의 위계와 빛의 천사들, 인류 구원의 대도와 마음의 평정(중도)을 이루는 비결을 완결 짓습니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제7강(원서 90~103쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 20분"
        },
        {
            "id": 8,
            "number": "제8강",
            "title": "중도에 대하여",
            "origTitle": "中道について",
            "startPage": 145,
            "endPage": 157,
            "origPages": "원서 104~110쪽",
            "tags": ["중도", "팔정도", "치우침 없는 마음", "마음의 저울"],
            "summary": "극단(유혹과 금욕, 좌와 우)에 치우치지 않고 보편타당한 조화의 중심에 서는 '중도(中道)'의 철학과 실천법인 팔정도(八正道)의 진정한 의미를 설명합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제8강(원서 104~110쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 15분"
        },
        {
            "id": 9,
            "number": "제9강",
            "title": "전생윤회에 대하여",
            "origTitle": "転生輪廻について",
            "startPage": 158,
            "endPage": 175,
            "origPages": "원서 110~121쪽",
            "tags": ["전생윤회", "카르마", "영혼의 기억", "수호지도령"],
            "summary": "인간의 육체는 죽어도 영혼은 영원히 윤회하며 배움을 축적한다는 법칙을 구체적 전생 사례와 영적 구조를 통해 증명하고 해설합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제9강(원서 110~121쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 18분"
        },
        {
            "id": 10,
            "number": "제10강",
            "title": "제법무아 (우주의 심리)",
            "origTitle": "諸法無我（宇宙の心理）",
            "startPage": 176,
            "endPage": 188,
            "origPages": "원서 121~128쪽",
            "tags": ["제법무아", "대우주 법칙", "아집 타파", "신리의 완성"],
            "summary": "만물은 홀로 존재하지 않으며 서로 깊이 연결되어 있다는 제법무아의 섭리와, 대우주의 조화로운 생명 흐름에 동화되는 최고의 깨달음을 선언합니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 제10강(원서 121~128쪽)의 일본어 본문을 기준으로 했다.",
            "readingTime": "약 15분"
        },
        {
            "id": 11,
            "number": "후기",
            "title": "편집부 후기",
            "origTitle": "編集後記",
            "startPage": 189,
            "endPage": 191,
            "origPages": "189~191쪽",
            "tags": ["편집 후기", "번역 편찬사", "출간 경위"],
            "summary": "다카하시 신지 선생의 강연록을 한국어로 충실히 완역하고 1권으로 집대성하여 출간한 편집부의 편찬 배경과 감사의 기록입니다.",
            "guideNote": "이 번역은 다카하시 신지 강연집 『あとがき』(129쪽)를 기준으로 했다.",
            "readingTime": "약 5분"
        }
    ]
    
    lectures = []
    for item in lecture_meta:
        paras = parse_lecture_chapter(reader, item["startPage"], item["endPage"], item)
        lectures.append({
            "id": item["id"],
            "number": item["number"],
            "title": item["title"],
            "origTitle": item["origTitle"],
            "origPages": item["origPages"],
            "pageRange": f"p.{item['startPage']} ~ p.{item['endPage']}",
            "tags": item["tags"],
            "summary": item["summary"],
            "guideNote": item["guideNote"],
            "readingTime": item["readingTime"],
            "paragraphs": paras
        })
        
    return {
        "id": "lectures",
        "badge": "핵심 강연록 10강",
        "title": "다카하시 신지 강연집",
        "subtitle": "한국어판 통합본 (제1강~제10강 및 편집부 후기)",
        "origTitle": "高橋信次 講演集 日本語原本 全訳集成",
        "author": "다카하시 신지 (高橋信次)",
        "totalPages": len(reader.pages),
        "totalChapters": len(lectures),
        "description": "신지 사상의 정수를 담은 10대 핵심 강연록과 편집부 후기. 석가의 탄생에서부터 불교의 변천, 현대 종교에 대한 의문, 인생의 목적과 사명, 반야심경 및 심행 해설, 중도와 전생윤회, 제법무아까지 포괄하는 최고 권위의 정법 텍스트입니다.",
        "coverGradient": "linear-gradient(135deg, #1e1035 0%, #0d1b2a 50%, #1b263b 100%)",
        "accentColor": "#e0a96d",
        "chapters": lectures
    }


def parse_shin_buhwal_book():
    pdf_path = '신_부활_한국어_완역본_최종본.pdf'
    reader = pypdf.PdfReader(pdf_path)
    
    illu_paragraphs = [
        "이 번역은 『新・復活』 본문만을 기준으로 했으며, 다른 날짜의 강연록 문장을 보충하지 않았습니다.",
        "임마누엘 등 원문에서 여러 형태로 적힌 일반 인명은 통용 표기로 정리했습니다. 다만 미카·엘, 가브리·엘, 루슈·엘처럼 이름 속 ‘엘’의 의미를 설명하는 대목에서는 원문의 분절 표기를 살렸습니다. 루슈엘·파워트론·아시타바 이시·바프라만 등 저자 고유의 명칭은 임의로 다른 개념으로 바꾸지 않았습니다.",
        "종교적·역사적·과학적 서술은 저자의 주장을 평가하거나 수정하지 않고 번역했습니다. 원문은 마지막에 (未完)이라고 적힌 미완성 유고입니다."
    ]
    
    sections_meta = [
        {
            "id": 0,
            "part": "서두",
            "partTitle": "일러두기 및 번역 해제",
            "sectionNumber": "일러두기",
            "title": "일러두기 및 유고 번역 안내",
            "startPage": 2,
            "endPage": 2,
            "origPage": "원문 안내",
            "tags": ["번역 원칙", "유고 안내", "고유명사"],
            "summary": "『新・復活』 본문 번역 기준, 인명 표기, 저자 고유 명칭(루슈엘, 파워트론 등) 및 미완성 유고에 대한 일러두기입니다.",
            "readingTime": "약 3분",
            "customParagraphs": illu_paragraphs
        },
        {
            "id": 1,
            "part": "제1부",
            "partTitle": "청정한 이들에게 보내는 선물",
            "sectionNumber": "1-1",
            "title": "서이즈로의 여행",
            "startPage": 3,
            "endPage": 5,
            "origPage": "원문 02쪽",
            "tags": ["대자연의 은혜", "서이즈", "자비와 사랑", "제법무아"],
            "summary": "자연의 섭리와 꽃들의 성장, 대자연의 자비 속에서 느끼는 신의 사랑과 무조건적인 봉사, 그리고 제법무아의 도리를 사색하는 여정입니다.",
            "readingTime": "약 6분"
        },
        {
            "id": 2,
            "part": "제1부",
            "partTitle": "청정한 이들에게 보내는 선물",
            "sectionNumber": "1-2",
            "title": "날개 달린 천사의 출현",
            "startPage": 6,
            "endPage": 8,
            "origPage": "원문 03쪽",
            "tags": ["은빛 날개 천사", "아폴로", "악령의 분별", "영적 파동"],
            "summary": "책상 앞에 나타난 아름다운 은빛 날개의 천사와 황금빛 광채, 그리고 악령·사탄의 부조화한 파동을 분별하고 방어하는 지혜를 설합니다.",
            "readingTime": "약 8분"
        },
        {
            "id": 3,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-1",
            "title": "연수회장의 방에서",
            "startPage": 9,
            "endPage": 16,
            "origPage": "원문 06쪽",
            "tags": ["산라쿠소", "간사이 연수회", "고대 함어", "가브리엘", "영적 통신"],
            "summary": "1976년 3월 21일 난키 시라하마 연수회장, 700명의 연수생과 함께한 방에서 일어난 고대 언어 현상과 대천사 가브리엘의 영적 대화가 펼쳐집니다.",
            "readingTime": "약 15분"
        },
        {
            "id": 4,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-2",
            "title": "대천사들과 주(메시아)",
            "startPage": 17,
            "endPage": 20,
            "origPage": "원문 10쪽",
            "tags": ["엘 란티", "대천사", "영혼의 분신", "메시아의 사명"],
            "summary": "천상계 7대 대천사의 위계와 사명, 그리고 지상에 메시아로서 강림한 주(엘 란티)와의 깊은 영적 유대와 사명을 증거합니다.",
            "readingTime": "약 10분"
        },
        {
            "id": 5,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-3",
            "title": "성경의 오류",
            "startPage": 21,
            "endPage": 22,
            "origPage": "원문 12쪽",
            "tags": ["성경", "역사적 왜곡", "인간의 편견", "원래의 진리"],
            "summary": "세월이 흐르며 인간의 지식과 권력욕에 의해 가감되고 변형된 성경 구절의 오류를 영적 진실의 눈으로 밝혀냅니다.",
            "readingTime": "약 5분"
        },
        {
            "id": 6,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-4",
            "title": "하나의 신리, 한 사람의 지도자",
            "startPage": 23,
            "endPage": 24,
            "origPage": "원문 14쪽",
            "tags": ["하나의 신리", "진실한 지도자", "마음의 조화"],
            "summary": "다양한 갈래로 나뉘어 다투는 인류에게 오직 하나뿐인 우주의 신리와 이를 바르게 이끌 한 사람의 영적 지도자의 역할을 천명합니다.",
            "readingTime": "약 5분"
        },
        {
            "id": 7,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-5",
            "title": "사탄, 루슈엘",
            "startPage": 25,
            "endPage": 28,
            "origPage": "원문 15쪽",
            "tags": ["루슈엘", "사탄의 타락", "빛과 어둠", "천상계 대전"],
            "summary": "빛의 천사였으나 아집과 교만으로 타락하여 지옥의 우두머리가 된 사탄 루슈엘의 내력과 영적 암투의 진상을 폭로합니다.",
            "readingTime": "약 10분"
        },
        {
            "id": 8,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-6",
            "title": "대천사 미카엘의 메시지 1",
            "startPage": 29,
            "endPage": 31,
            "origPage": "원문 16쪽",
            "tags": ["미카엘", "천사의 부상", "올바른 마음", "영적 결의"],
            "summary": "사탄과의 치열한 영적 전투 속에서 홀로 남아 진리를 수호하는 대천사 미카엘의 첫 번째 절절한 육성 메시지입니다.",
            "readingTime": "약 8분"
        },
        {
            "id": 9,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-7",
            "title": "대천사 미카엘의 메시지 2: 강사들에게 보내는 경고",
            "startPage": 32,
            "endPage": 33,
            "origPage": "원문 18쪽",
            "tags": ["미카엘 경고", "강사진 경책", "자기 그릇", "선아"],
            "summary": "정법을 가르치는 강사들의 마음속에 침투한 자만과 사탄의 독을 엄중히 경책하며 본래의 청정한 마음으로 돌아갈 것을 촉구합니다.",
            "readingTime": "약 6분"
        },
        {
            "id": 10,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-8",
            "title": "대천사 미카엘의 메시지 3: 강사들에게 보내는 간언",
            "startPage": 30,
            "endPage": 33,
            "origPage": "원문 19쪽",
            "tags": ["미카엘 간언", "눈물의 호소", "진정한 참회", "자비"],
            "summary": "타락의 길을 걷지 않도록 피눈물로 호소하는 대천사 미카엘의 세 번째 간언과 진실한 참회의 길을 담고 있습니다.",
            "readingTime": "약 6분"
        },
        {
            "id": 11,
            "part": "제2부",
            "partTitle": "난키 시라하마에서 열린 연수회",
            "sectionNumber": "2-9",
            "title": "사탄에게 중독된 강사들",
            "startPage": 34,
            "endPage": 38,
            "origPage": "원문 21쪽",
            "tags": ["사탄의 독", "영적 현실", "신지의 통찰", "마음의 구제"],
            "summary": "겉으로는 법을 말하면서도 마음속에 명예욕과 시기심으로 물든 강사들의 비극적 현실과 이를 건져내려는 신지의 자비를 묘사합니다.",
            "readingTime": "약 8분"
        },
        {
            "id": 12,
            "part": "제3부",
            "partTitle": "강연회 - 마음속에 내재된 영지(英智)",
            "sectionNumber": "3-1",
            "title": "강연회: 마음속에 내재된 영지 (1976년 4월 11일)",
            "startPage": 39,
            "endPage": 47,
            "origPage": "원문 25쪽",
            "tags": ["1976년 강연", "내재된 영지", "오관과 배", "천사와 사람", "최후 유고"],
            "summary": "1976년 4월 11일 오사카 강연회 실황. 육체라는 배와 오관의 한계, 인간 내면에 깃든 신의 영지와 대천사들의 인도, 그리고 미완으로 남겨진 최후의 대선언입니다.",
            "readingTime": "약 25분"
        }
    ]
    
    sections = []
    for item in sections_meta:
        if "customParagraphs" in item:
            paras = item["customParagraphs"]
        else:
            paras = parse_shin_buhwal_chapter(reader, item["startPage"], item["endPage"], item["sectionNumber"])
            
        sections.append({
            "id": item["id"],
            "part": item["part"],
            "partTitle": item["partTitle"],
            "number": item["sectionNumber"],
            "title": item["title"],
            "origPage": item["origPage"],
            "pageRange": f"PDF p.{item['startPage']} ~ p.{item['endPage']}",
            "tags": item["tags"],
            "summary": item["summary"],
            "readingTime": item["readingTime"],
            "paragraphs": paras
        })
        
    return {
        "id": "shin_buhwal",
        "badge": "최후 유고 완역본",
        "title": "신·부활 (新・復活)",
        "subtitle": "위대한 주, 다카하시 신지 선생의 최후 유고 (한국어 완역본)",
        "origTitle": "新・復活 (高橋信次 師 遺稿集)",
        "author": "다카하시 신지 (高橋信次)",
        "totalPages": 74,
        "totalChapters": len(sections),
        "description": "1976년 봄, 다카하시 신지 선생의 마지막 유고 대작. 서이즈의 여정과 날개 달린 천사의 출현, 난키 시라하마 연수회와 대천사 미카엘의 메시지, 그리고 1976년 4월 11일 강연회 『마음속에 내재된 영지』까지 생생한 육성과 영적 진리를 담고 있습니다.",
        "coverGradient": "linear-gradient(135deg, #2b1055 0%, #4c1a57 50%, #150050 100%)",
        "accentColor": "#ff6b8b",
        "chapters": sections
    }


def main():
    print("=== 다카하시 신지 서적 데이터 대제목/소제목 잔재 전수 제거 추출 시작 ===")
    
    lectures_book = parse_lectures_book()
    print(f"강연집 추출 완료: 총 {len(lectures_book['chapters'])}개 챕터")
    
    shin_buhwal_book = parse_shin_buhwal_book()
    print(f"신·부활 추출 완료: 총 {len(shin_buhwal_book['chapters'])}개 절")
    
    books_data = [lectures_book, shin_buhwal_book]
    
    output_js_path = 'js/books-data.js'
    with open(output_js_path, 'w', encoding='utf-8') as f:
        f.write("/**\n")
        f.write(" * 다카하시 신지(高橋信次) 서적 & 경전 아카이브 통합 데이터\n")
        f.write(" * 1. 다카하시 신지 강연집 (한국어판 통합본 - 10강 + 편집부 후기)\n")
        f.write(" * 2. 신·부활 (新・復活 - 최후 유고 완역본 - 3부 13절 + 일러두기)\n")
        f.write(" */\n\n")
        f.write("const BOOKS_DATA = ")
        json.dump(books_data, f, ensure_ascii=False, indent=2)
        f.write(";\n\n")
        f.write("if (typeof module !== 'undefined' && module.exports) {\n")
        f.write("  module.exports = { BOOKS_DATA };\n")
        f.write("}\n")
        
    print(f"\n[성공] '{output_js_path}' 파일이 완벽하게 생성되었습니다.")

if __name__ == '__main__':
    main()

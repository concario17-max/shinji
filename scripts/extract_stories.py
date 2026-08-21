"""
다카하시 신지 이야기(001~237) PDF 완벽 파서 및 데이터 생성기 (전수 검사 및 교정 버전)
- 1:1 대응 237개 이야기 완벽 추출 (236화 + 237화 후기 분리)
- 한국어 번역문 단어 쪼개짐, 띄어쓰기, 문장 부호 완벽 복원
- 보조용언(있습니다/없습니다), 의존명사(수/것/적), 조사 띄어쓰기 정밀 교정
- 본문(body)과 해설/번역 메모(notes) 명확 분리 및 불릿 기호(•) 표준화
- '충실번역' -> '번역' 명칭 정돈
- WebP 2단계 압축 썸네일/고화질 이미지 매핑
"""

import os
import sys
import re
import json
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

def clean_korean_text(text):
    if not text:
        return ""
    
    # 1. Normalize line endings and strip PDF running headers/footers
    t = text.replace('\r\n', '\n').replace('\r', '\n')
    t = re.sub(r'다카하시\s*신지\s*이야기\s*·\s*\d+–\d+\s*통합본\s*\n\d+\s*\n', '', t)
    t = re.sub(r'제\d+부\s*·\s*\d+–\d+\s*\n\d+–\d+\s*·\s*\d+개\s*항목\s*', '', t)
    t = re.sub(r'충실\s*번역\s*원칙', '번역 원칙', t)
    t = re.sub(r'(?:충실\s*)?번역\s*\n', '', t)
    
    # 2. Standardize bullet points and non-standard whitespace
    t = re.sub(r'[\uf0b7\uf0a7\u2022]\s*', '• ', t)
    t = t.replace('\xa0', ' ')
    
    # 3. Clean spaces before/after punctuation
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\s+([,\.!\?\)\]\}”’」』])', r'\1', t)
    t = re.sub(r'([\(\[\{“‘「『])\s+', r'\1', t)
    
    # 4. Ensure space after sentence-ending punctuation when followed by Korean / quotes
    t = re.sub(r'([\.!\?])([가-힣“‘「『])', r'\1 \2', t)
    t = re.sub(r'([,])([가-힣])', r'\1 \2', t)
    
    return t.strip()

def reconstruct_clean_paragraph(lines):
    if not lines:
        return ""
    
    merged = ""
    for i, line in enumerate(lines):
        curr = line.strip()
        if not curr:
            continue
        if i == 0:
            merged = curr
            continue
        
        prev = lines[i-1]
        had_space = prev.endswith((' ', '\t'))
        
        # Check if mid-word split without space in original PDF
        if not had_space and merged and re.search(r'[가-힣]$', merged) and re.match(r'^[가-힣]', curr):
            merged += curr
        else:
            merged += ' ' + curr
            
    # Clean up double spaces and punctuation spacing
    merged = re.sub(r'[ \t]+', ' ', merged)
    merged = re.sub(r'\s+([,\.!\?\)\]\}”’」』])', r'\1', merged)
    merged = re.sub(r'([\(\[\{“‘「『])\s+', r'\1', merged)
    merged = re.sub(r'([\.!\?])([가-힣“‘「『])', r'\1 \2', merged)
    merged = re.sub(r'([,])([가-힣])', r'\1 \2', merged)
    
    # Word-internal split reconnection rules
    merged = re.sub(r'([가-힣]+)\s+(습니다|었습|았습|했습|있습|없습|됐습|였습|습니)', r'\1\2', merged)
    merged = re.sub(r'([가-힣]+)\s+(었|았|였|겠|렀|렸|쳤|혔|췄|켰|폈)([다던든네며면고])', r'\1\2\3', merged)
    merged = re.sub(r'\b(이야)\s+(기)\b', r'이야기', merged)
    merged = re.sub(r'\b(다카하)\s+(시)\b', r'다카하시', merged)
    merged = re.sub(r'\b(소노가시)\s+(라)\b', r'소노가시라', merged)
    merged = re.sub(r'\b(선)\s+(생)\b', r'선생', merged)
    merged = re.sub(r'\b(지상)\s+(계)\b', r'지상계', merged)
    merged = re.sub(r'\b(천상)\s+(계)\b', r'천상계', merged)
    merged = re.sub(r'\b(수호)\s+(령)\b', r'수호령', merged)
    merged = re.sub(r'\b(지도)\s+(령)\b', r'지도령', merged)
    merged = re.sub(r'\b(비디오)\s+(테이프)\b', r'비디오테이프', merged)
    merged = re.sub(r'\b(자서)\s+(전)\b', r'자서전', merged)
    merged = re.sub(r'\b(불가사)\s+(의)\b', r'불가사의', merged)
    merged = re.sub(r'\b(그)\s+(러자|러나|리고|러므로)\b', r'그\1', merged)
    merged = re.sub(r'\b(마)\s+(침내)\b', r'마침내', merged)
    merged = re.sub(r'\b(어)\s+(머니|린)\b', r'어\1', merged)
    merged = re.sub(r'\b(아)\s+(버지)\b', r'아버지', merged)
    
    return merged.strip()

def refine_korean_text(text):
    if not text:
        return ""
    
    t = text
    
    # 1. Spacing after particles and connectives followed by 있다/없다
    t = re.sub(r'([가-힣]+(?:고|어|아|여|해|려|러|되어|되고|되며|전해|실려|쓰여|남아|놓여|들어|살아|않아|않고|못해|못하고|달려|[은는이가을를의에과와도만밖에]))\s*(있습니다|없습니다|있었다|없었다|있었고|없었고|있으며|없으며|있으나|없으나|있지만|없지만|있지요|없지요|있는|없는|있다|없다|있었|없었)', r'\1 \2', t)
    
    # 2. Dependent nouns (의존명사): 수 있다/없다, 것 같다/이다, 적이 있다/없다, 줄 알다/모르다, 때문에
    t = re.sub(r'([가-힣]+)(수)(있습니다|없습니다|있었다|없었다|있는|없는|있다|없다|있었고|없었고|있으며|없으며|있지요|없지요)', r'\1 \2 \3', t)
    t = re.sub(r'([가-힣]+)(것)(같습니다|같았다|같다|같고|같으며|입니다|이었다|이다|이란|이라)', r'\1 \2 \3', t)
    t = re.sub(r'([가-힣]+)(적)(이|도)(있습니다|없습니다|있었다|없었다|있는|없는|있다|없다)', r'\1 \2\3 \4', t)
    t = re.sub(r'([가-힣]+)(줄)(알았습니다|알았다|압니다|안다|알고|모릅니다|몰랐다|모르고)', r'\1 \2 \3', t)
    t = re.sub(r'([가-힣]+)(때)(문)(에|이다|입니다|이었다|이었)', r'\1 \2\3\4', t)
    
    # 4. Spacing for fused headings / titles
    t = re.sub(r'([가-힣]+)\s*발췌([가-힣]+)', r'\1 발췌\n\n\2', t)
    t = re.sub(r'([가-힣]+)\s*관하여([가-힣]+)', r'\1 관하여\n\n\2', t)
    t = re.sub(r'([가-힣]+)\s*대하여([가-힣]+)', r'\1 대하여\n\n\2', t)
    t = re.sub(r'상담\s*상대다음으로', '상담 상대\n\n다음으로', t)
    t = re.sub(r'이상원문', '이상, 원문', t)
    t = re.sub(r'충실\s*번역\s*원칙', '번역 원칙', t)
    t = re.sub(r'충실\s*번역', '번역', t)
    t = re.sub(r'충실번역', '번역', t)
    
    # 5. Punctuation spacing
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\s+([,\.!\?\)\]\}”’」』])', r'\1', t)
    t = re.sub(r'([\(\[\{“‘「『])\s+', r'\1', t)
    t = re.sub(r'([\.!\?])([가-힣“‘「『])', r'\1 \2', t)
    t = re.sub(r'([,])([가-힣])', r'\1 \2', t)
    
    # 6. Clean multiple blank lines
    t = re.sub(r'\n{3,}', '\n\n', t)
    
    return t.strip()

def normalize_korean_paragraphs(raw_text):
    if not raw_text:
        return ""
    
    text = clean_korean_text(raw_text)
    raw_lines = text.split('\n')
    
    paragraphs = []
    current_para = []
    
    for raw_line in raw_lines:
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            if current_para:
                paragraphs.append(reconstruct_clean_paragraph(current_para))
                current_para = []
            continue
        
        is_dialogue = stripped.startswith(('“', '"', '「', '『', '‘', "'"))
        is_bullet = stripped.startswith(('•', '※', '·', '-', '*', '1.', '2.', '3.', '①', '②', '[', '【'))
        
        if current_para:
            prev_line = current_para[-1].rstrip()
            prev_stripped = prev_line.strip()
            ends_sentence = prev_stripped.endswith(('.', '!', '?', '”', '"', '…', '’', '”', '』', '」'))
            
            if is_dialogue or is_bullet:
                paragraphs.append(reconstruct_clean_paragraph(current_para))
                current_para = [raw_line]
            elif ends_sentence and (is_dialogue or stripped.startswith(('또한', '그러나', '그러자', '그 후', '잠시 뒤', '남자는', '이처럼', '그리고', '그는', '그녀는', '마침내', '결국', '한편', '이어서', '그때', '이윽고'))):
                paragraphs.append(reconstruct_clean_paragraph(current_para))
                current_para = [raw_line]
            else:
                current_para.append(raw_line)
        else:
            current_para.append(raw_line)
            
    if current_para:
        paragraphs.append(reconstruct_clean_paragraph(current_para))
        
    result = '\n\n'.join(p for p in paragraphs if p)
    return refine_korean_text(result)

def separate_body_and_notes(raw_content):
    lines = raw_content.split('\n')
    split_idx = -1
    
    for i, line in enumerate(lines):
        line_s = line.strip()
        if not line_s:
            continue
        # Bullet notes or commentary headers
        if re.match(r'^[\uf0b7\uf0a7\u2022•※]', line_s):
            split_idx = i
            break
        if re.match(r'^(?:번역\s*(?:·\s*제작)?\s*메모|사실\s*관계\s*주의|원문[·\s]*자료\s*대조\s*참고|원문\s*대조\s*참고|편집자\s*(?:신앙\s*)?고백|편집자의\s*종교적\s*해석|참고\s*:)', line_s):
            split_idx = i
            break
        if re.match(r'^제\d+부\s*·\s*\d+–\d+', line_s) or re.match(r'^\d+–\d+\s*·\s*\d+개\s*항목', line_s):
            split_idx = i
            break
            
    if split_idx != -1:
        body_part = '\n'.join(lines[:split_idx]).strip()
        notes_part = '\n'.join(lines[split_idx:]).strip()
    else:
        body_part = raw_content.strip()
        notes_part = ""
        
    return body_part, notes_part

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_images_dir = os.path.join(base_dir, '새 폴더')
    dst_images_dir = os.path.join(base_dir, 'images', 'stories')
    dst_thumbs_dir = os.path.join(dst_images_dir, 'thumbs')
    pdf_path = os.path.join(src_images_dir, '다카하시_신지_이야기_001-236_한국어_충실번역_번호별_새페이지_최종본.pdf')
    out_js_path = os.path.join(base_dir, 'js', 'stories-data.js')

    os.makedirs(dst_images_dir, exist_ok=True)
    os.makedirs(dst_thumbs_dir, exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)

    if not os.path.exists(pdf_path):
        print(f"PDF not found at {pdf_path}")
        return

    print("Reading PDF file...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = ''
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ''
        t = re.sub(r'다카하시\s*신지\s*이야기\s*·\s*001–236\s*통합본\s*\n\d+\s*\n', '', t)
        full_text += '\n' + t

    items = list(re.finditer(r'\n(\d{3})\.\s+([^\n]+)\n(.*?)(?=\n\d{3}\.\s+|\Z)', full_text, re.DOTALL))
    print(f"Parsed {len(items)} items from PDF.")

    CHAPTER_METAS = {
        1: {
            'id': 1,
            'name': '제1장',
            'title': '탄생과 전생, 그리고 참된 메시아의 출현',
            'fullTitle': '제1장 · 탄생과 전생, 그리고 참된 메시아의 출현',
            'range': '001–050',
            'badgeColor': 'emerald',
            'flow': '출생·가족·전생 → 어린 시절 체험 → 영적 각성 → 신지의 사명과 정법'
        },
        2: {
            'id': 2,
            'name': '제2장',
            'title': '영혼의 세계와 정법의 실천',
            'fullTitle': '제2장 · 영혼의 세계와 정법의 실천',
            'range': '051–100',
            'badgeColor': 'blue',
            'flow': '영혼·수호령·지도령 → 윤회 → 빙의·영적 현상 → 마음과 생활의 조화'
        },
        3: {
            'id': 3,
            'name': '제3장',
            'title': '마음의 본질과 인간의 목적·사명',
            'fullTitle': '제3장 · 마음의 본질과 인간의 목적·사명',
            'range': '101–150',
            'badgeColor': 'purple',
            'flow': '마음의 구조 → 신리와 과학 → 인간의 목적 → 윤회와 사명 → 사후세계와 현증'
        },
        4: {
            'id': 4,
            'name': '제4장',
            'title': '정법의 전개와 삶에서 드러나는 현증',
            'fullTitle': '제4장 · 정법의 전개와 삶에서 드러나는 현증',
            'range': '151–200',
            'badgeColor': 'amber',
            'flow': '정법의 유전 → 사회·종교 비판 → 다양한 체험·현증 → 인생의 의미와 실천'
        },
        5: {
            'id': 5,
            'name': '제5장',
            'title': '신리의 완성과 인류·지구의 미래',
            'fullTitle': '제5장 · 신리의 완성과 인류·지구의 미래',
            'range': '201–237',
            'badgeColor': 'rose',
            'flow': '새로운 부활 → 태양계의 천사들 → 지구와 인류 → 마지막 기록 및 후기'
        }
    }

    stories = []
    for match in items:
        num_str, title_str, raw_body = match.groups()
        item_id = int(num_str)

        if 1 <= item_id <= 50:
            chap_num = 1
        elif 51 <= item_id <= 100:
            chap_num = 2
        elif 101 <= item_id <= 150:
            chap_num = 3
        elif 151 <= item_id <= 200:
            chap_num = 4
        else:
            chap_num = 5

        # Special Handling for Item 236 (Split into 236 and 237)
        if item_id == 236:
            m_hooki = re.search(r'\n후기\s*\n', raw_body)
            if m_hooki:
                raw_236 = raw_body[:m_hooki.start()].strip()
                raw_237 = raw_body[m_hooki.end():].strip()
            else:
                raw_236 = raw_body
                raw_237 = ""

            orig_title_236 = '「高橋信次師物語」 真のメシヤの記録 236　八起正法先生編'
            content_type_236 = '웹 편집자의 종합 서술 및 신앙적 해석'

            body_236_raw, notes_236_raw = separate_body_and_notes(raw_236)
            body_236_raw = re.sub(r'원제:[^\n]+\n', '', body_236_raw).strip()
            body_236_raw = re.sub(r'내용\s*성격:[^\n]+\n', '', body_236_raw).strip()

            body_236 = normalize_korean_paragraphs(body_236_raw)
            notes_236 = normalize_korean_paragraphs(notes_236_raw)

            clean_body_236 = re.sub(r'\s+', ' ', body_236)
            summary_236 = clean_body_236[:140] + ('...' if len(clean_body_236) > 140 else '')

            img_236 = 'images/stories/236.webp'
            thumb_236 = 'images/stories/thumbs/236.webp'
            has_img_236 = os.path.exists(os.path.join(dst_images_dir, '236.webp'))

            stories.append({
                'id': 236,
                'number': '#236',
                'num': '236',
                'chapter': 5,
                'chapterMeta': CHAPTER_METAS[5],
                'title': '신지 선생에 대한 종합 서술',
                'origTitle': orig_title_236,
                'contentType': content_type_236,
                'summary': summary_236,
                'body': body_236,
                'notes': notes_236,
                'image': img_236,
                'thumb': thumb_236,
                'hasImage': has_img_236
            })

            orig_title_237 = '後記 - 資料を集めて「信次師」物語へ'
            content_type_237 = '웹 편집자의 집필 회고 및 감사 맺음말'

            # In 237, separate "이상, 원문 맨 마지막에는..." as note
            m_237_note = re.search(r'이상\s*원문\s*맨\s*마지막에는', raw_237)
            if m_237_note:
                raw_237_body = raw_237[:m_237_note.start()].strip()
                raw_237_notes = raw_237[m_237_note.start():].strip()
            else:
                raw_237_body, raw_237_notes = separate_body_and_notes(raw_237)

            body_237 = normalize_korean_paragraphs(raw_237_body)
            notes_237 = normalize_korean_paragraphs(raw_237_notes)

            clean_body_237 = re.sub(r'\s+', ' ', body_237)
            summary_237 = clean_body_237[:140] + ('...' if len(clean_body_237) > 140 else '')

            img_237 = 'images/stories/237.webp'
            thumb_237 = 'images/stories/thumbs/237.webp'
            has_img_237 = os.path.exists(os.path.join(dst_images_dir, '237.webp'))

            stories.append({
                'id': 237,
                'number': '#237',
                'num': '237',
                'chapter': 5,
                'chapterMeta': CHAPTER_METAS[5],
                'title': '[후기] 자료를 모아 ‘신지 사(信次師)’ 이야기로',
                'origTitle': orig_title_237,
                'contentType': content_type_237,
                'summary': summary_237,
                'body': body_237,
                'notes': notes_237,
                'image': img_237,
                'thumb': thumb_237,
                'hasImage': has_img_237
            })
            continue

        # Regular Items (001 ~ 235)
        orig_title = ''
        content_type = ''
        m_orig = re.search(r'원제:\s*([^\n]+)', raw_body)
        if m_orig:
            orig_title = m_orig.group(1).strip()

        m_type = re.search(r'내용\s*성격:\s*([^\n]+)', raw_body)
        if m_type:
            content_type = m_type.group(1).strip()

        m_body_split = re.search(r'(?:충실\s*)?번역\s*\n', raw_body)
        if m_body_split:
            main_content = raw_body[m_body_split.end():]
        else:
            main_content = raw_body
            if m_orig:
                main_content = main_content.replace(m_orig.group(0), '')
            if m_type:
                main_content = main_content.replace(m_type.group(0), '')

        body_raw, notes_raw = separate_body_and_notes(main_content)

        body_text = normalize_korean_paragraphs(body_raw)
        notes_text = normalize_korean_paragraphs(notes_raw)

        clean_body_for_summary = re.sub(r'\s+', ' ', body_text)
        summary_snippet = clean_body_for_summary[:140] + ('...' if len(clean_body_for_summary) > 140 else '')

        webp_filename = f'{num_str}.webp'
        has_image = os.path.exists(os.path.join(dst_images_dir, webp_filename))

        stories.append({
            'id': item_id,
            'number': f'#{num_str}',
            'num': num_str,
            'chapter': chap_num,
            'chapterMeta': CHAPTER_METAS[chap_num],
            'title': title_str.strip(),
            'origTitle': orig_title,
            'contentType': content_type,
            'summary': summary_snippet,
            'body': body_text,
            'notes': notes_text,
            'image': f'images/stories/{webp_filename}',
            'thumb': f'images/stories/thumbs/{webp_filename}',
            'hasImage': has_image
        })

    stories.sort(key=lambda s: s['id'])

    js_content = f'''/**
 * 다카하시 신지 이야기 (高橋信次物語) 전체 데이터베이스 (001~237)
 * 5개 장 구성 및 1:1 만화/번역 완벽 매핑 (전수 검사 및 교정 완료)
 */

const STORY_CHAPTERS = {json.dumps(list(CHAPTER_METAS.values()), ensure_ascii=False, indent=2)};

const STORIES_DATA = {json.dumps(stories, ensure_ascii=False, indent=2)};
'''

    with open(out_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Generated {out_js_path} with {len(stories)} stories.")
    print(f"Stories with image: {sum(1 for s in stories if s['hasImage'])} / {len(stories)}")
    print(f"Stories with notes: {sum(1 for s in stories if s['notes'])} / {len(stories)}")

if __name__ == '__main__':
    main()

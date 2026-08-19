"""
다카하시 신지 이야기(001~236) PDF 자동 파서 및 데이터 생성 스크립트
"""

import os
import sys
import re
import json
import shutil
import pypdf

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_images_dir = os.path.join(base_dir, '새 폴더')
    dst_images_dir = os.path.join(base_dir, 'images', 'stories')
    pdf_path = os.path.join(src_images_dir, '다카하시_신지_이야기_001-236_한국어_충실번역_번호별_새페이지_최종본.pdf')
    out_js_path = os.path.join(base_dir, 'js', 'stories-data.js')

    os.makedirs(dst_images_dir, exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)

    # 1. Copy images
    copied = 0
    if os.path.exists(src_images_dir):
        for f in os.listdir(src_images_dir):
            if f.lower().endswith('.png'):
                s = os.path.join(src_images_dir, f)
                d = os.path.join(dst_images_dir, f)
                if not os.path.exists(d) or os.path.getsize(s) != os.path.getsize(d):
                    shutil.copy2(s, d)
                    copied += 1
    print(f"Copied {copied} images to {dst_images_dir}")

    # 2. Parse PDF
    if not os.path.exists(pdf_path):
        print(f"PDF not found at {pdf_path}")
        return

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
            'range': '201–236',
            'badgeColor': 'rose',
            'flow': '새로운 부활 → 태양계의 천사들 → 지구와 인류 → 신리의 궁극적 방향 → 마지막 기록'
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

        orig_title = ''
        content_type = ''
        m_orig = re.search(r'원제:\s*([^\n]+)', raw_body)
        if m_orig:
            orig_title = m_orig.group(1).strip()

        m_type = re.search(r'내용\s*성격:\s*([^\n]+)', raw_body)
        if m_type:
            content_type = m_type.group(1).strip()

        m_body_split = re.search(r'충실\s*번역\s*\n', raw_body)
        if m_body_split:
            main_content = raw_body[m_body_split.end():]
        else:
            main_content = raw_body
            if m_orig:
                main_content = main_content.replace(m_orig.group(0), '')
            if m_type:
                main_content = main_content.replace(m_type.group(0), '')

        m_notes = re.search(r'\n(번역\s*메모[^\n]*\n|참고[^\n]*\n|편집자\s*(?:신앙\s*)?고백[^\n]*\n|편집자의\s*종교적\s*해석[^\n]*\n)', main_content)
        if m_notes:
            body_text = main_content[:m_notes.start()].strip()
            notes_text = main_content[m_notes.start():].strip()
        else:
            body_text = main_content.strip()

        clean_body_for_summary = re.sub(r'\s+', ' ', body_text)
        summary_snippet = clean_body_for_summary[:140] + ('...' if len(clean_body_for_summary) > 140 else '')

        img_filename = f'{num_str}.png'
        has_image = os.path.exists(os.path.join(dst_images_dir, img_filename))

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
            'image': f'images/stories/{img_filename}',
            'hasImage': has_image
        })

    js_content = f'''/**
 * 다카하시 신지 이야기 (高橋信次物語) 전체 데이터베이스 (001~236)
 * 5개 장 구성 및 1:1 만화/번역 매핑
 */

const STORY_CHAPTERS = {json.dumps(list(CHAPTER_METAS.values()), ensure_ascii=False, indent=2)};

const STORIES_DATA = {json.dumps(stories, ensure_ascii=False, indent=2)};
'''

    with open(out_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Generated {out_js_path} with {len(stories)} stories.")

if __name__ == '__main__':
    main()

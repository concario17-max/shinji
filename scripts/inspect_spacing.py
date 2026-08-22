"""
한국어 띄어쓰기 오류 및 긴 붙어쓰기 어절 전수 조사 스크립트
1. 조사/어미 뒤 공백 탈락 (예: 생활에도여유가, 사람들에게는사랑이, 등으로말미암아 등)
2. 의존명사/보조용언 붙어쓰기 (예: 수있다, 수없다, 줄알다 등)
3. 8글자 이상 연속된 한글 어절 추출 및 분석
"""

import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

# Common Korean particles & endings that often precede a missing space
PARTICLES_ENDINGS = [
    r'에도', r'에는', r'에게도', r'에서도', r'으로도', r'로도', r'까지도', r'마저도',
    r'에서는', r'에게는', r'으로는', r'로서는', r'에게서', r'으로부터', r'로부터',
    r'이라는', r'이라는것', r'라는것', r'이라고', r'라고', r'으로서', r'으로써',
    r'하고', r'하며', r'하여', r'해서', r'하면서', r'하다가', r'하므로', r'하지만',
    r'되었고', r'되어서', r'되며', r'되며는', r'되어', r'되거나',
    r'있으며', r'있어서', r'있었고', r'있지만', r'있는데',
    r'없으며', r'없어서', r'없었고', r'없지만', r'없는데',
    r'뿐만아니라', r'뿐아니라', r'뿐만'
]

def analyze_spacing_issues(text, source_name=""):
    issues = []
    
    # 1. Check for specific known stuck pattern: '생활에도여유가'
    # Pattern: [가-힣]{2,}(에도|에는|에게도|에서도|으로도|에서는|에게는|에게서|으로부터|뿐만아니라)[가-힣]{2,}
    regex_particles = re.compile(r'([가-힣]{2,}(?:에도|에는|에게도|에서도|으로도|에서는|에게는|에게서|으로부터|뿐만아니라|되었고|되어서|있었고|없었고))([가-힣]{2,})')
    
    for m in regex_particles.finditer(text):
        full_match = m.group(0)
        part1 = m.group(1)
        part2 = m.group(2)
        # Check false positives (if any)
        issues.append({
            'type': '조사/어미 뒤 붙어쓰기',
            'matched': full_match,
            'suggested': f"{part1} {part2}"
        })
        
    # 2. Check for missing space before/after '수' in '수있다/수없다/수도'
    regex_su = re.compile(r'([가-힣]+)(수\s*(?:있|없|도|밖))')
    for m in regex_su.finditer(text):
        if not m.group(1).endswith((' ', '\t', '\n')):
            # e.g., '할수있다' -> '할 수 있다'
            full_match = m.group(0)
            issues.append({
                'type': '의존명사(수) 붙어쓰기',
                'matched': full_match,
                'suggested': f"{m.group(1)} {m.group(2)}"
            })

    # 3. Check for long continuous Korean words (length >= 8)
    words = re.findall(r'[가-힣]{8,}', text)
    for w in set(words):
        # Exclude known long proper nouns / compounds if any
        issues.append({
            'type': '8글자 이상 긴 연속 한글',
            'matched': w,
            'suggested': '-'
        })
        
    return issues

def main():
    print("=" * 60)
    print("js/books-data.js 띄어쓰기 전수 조사")
    print("=" * 60)
    
    with open('js/books-data.js', 'r', encoding='utf-8') as f:
        books_content = f.read()
        
    json_str = books_content[books_content.find('['):books_content.rfind(']')+1]
    books = json.loads(json_str)
    
    all_books_issues = []
    for b in books:
        for ch in b['chapters']:
            for p_idx, p in enumerate(ch.get('paragraphs', [])):
                issues = analyze_spacing_issues(p, f"{b['title']} - {ch['number']}")
                for iss in issues:
                    iss['loc'] = f"[{b['title']} - {ch['number']} P{p_idx+1}]"
                    all_books_issues.append(iss)
                    
    print(f"발견된 띄어쓰기 의심 건수: {len(all_books_issues)}건")
    
    particle_issues = [i for i in all_books_issues if i['type'] == '조사/어미 뒤 붙어쓰기']
    print(f"\n[1. 조사/어미 뒤 붙어쓰기]: {len(particle_issues)}건")
    for idx, pi in enumerate(particle_issues[:35]):
        print(f"  ({idx+1}) {pi['loc']} '{pi['matched']}' -> 제안: '{pi['suggested']}'")
        
    su_issues = [i for i in all_books_issues if i['type'] == '의존명사(수) 붙어쓰기']
    print(f"\n[2. 의존명사(수) 붙어쓰기]: {len(su_issues)}건")
    for idx, si in enumerate(su_issues[:20]):
        print(f"  ({idx+1}) {si['loc']} '{si['matched']}' -> 제안: '{si['suggested']}'")

    long_words = [i for i in all_books_issues if i['type'] == '8글자 이상 긴 연속 한글']
    print(f"\n[3. 8글자 이상 긴 어절]: {len(long_words)}건")
    for idx, lw in enumerate(long_words[:35]):
        print(f"  ({idx+1}) {lw['loc']} '{lw['matched']}'")

if __name__ == '__main__':
    main()

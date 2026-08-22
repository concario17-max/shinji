"""
전체 데이터(js/books-data.js, js/stories-data.js) 챕터별 첫 단락 및 특수 아티팩트 전수 검사 스크립트
"""

import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

def inspect_all():
    with open('js/books-data.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    json_str = content[content.find('['):content.rfind(']')+1]
    books = json.loads(json_str)
    
    for book in books:
        print("=" * 60)
        print(f"BOOK: {book['title']} (총 {len(book['chapters'])}개 챕터)")
        print("=" * 60)
        for ch in book['chapters']:
            paras = ch.get('paragraphs', [])
            p1 = paras[0] if paras else '[EMPTY]'
            p_last = paras[-1] if paras else '[EMPTY]'
            print(f"[{ch['number']}] {ch['title']} (단락수: {len(paras)})")
            print(f"   • 시작: {p1[:90]}...")
            print(f"   • 끝:   {p_last[-70:]}\n")

if __name__ == '__main__':
    inspect_all()

"""
제목/부제/소제목이 본문 첫 문장이나 단락 중간에 결합된 모든 케이스 전수 조사 스크립트
"""

import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

def check_all_leaks():
    with open('js/books-data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    json_str = content[content.find('['):content.rfind(']')+1]
    books = json.loads(json_str)
    
    # Check for specific section title leaks
    subtitles = [
        '청정한 이들에게 보내는 선물', '청정한이들에게보내는선물',
        '서이즈로의 여행', '서이즈로의여행',
        '날개 달린 천사의 출현', '날개달린천사의출현',
        '난키 시라하마에서 열린 연수회', '난키시라하마에서열린연수회',
        '연수회장의 방에서', '연수회장의방에서',
        '대천사들과 주(메시아)', '대천사들과주(메시아)', '대천사들과 주', '대천사들과주',
        '성경의 오류', '성경의오류',
        '하나의 신리, 한 사람의 지도자', '하나의신리, 한사람의지도자', '하나의신리,한사람의지도자',
        '사탄, 루슈엘', '사탄,루슈엘', '사탄 루슈엘', '사탄루슈엘',
        '대천사 미카엘의 메시지 1', '대천사미카엘의메시지 1', '대천사미카엘의메시지1',
        '대천사 미카엘의 메시지 2', '대천사미카엘의메시지 2', '대천사미카엘의메시지2',
        '대천사 미카엘의 메시지 3', '대천사미카엘의메시지 3', '대천사미카엘의메시지3',
        '사탄에게 중독된 강사들', '사탄에게중독된강사들',
        '마음속에 내재된 영지', '마음속에내재된영지',
        '행위가곧빛이다', '행위가 곧 빛이다',
        '인욕의마음', '인욕의 마음',
        '편찬계획과첫확신', '편찬 계획과 첫 확신',
        '큰결단과하늘의배려', '큰 결단과 하늘의 배려',
        '심행과기원문', '심행과 기원문',
        '현세의천사와삶의목적', '현세의 천사와 삶의 목적',
        '중도라는자연의이치', '중도라는 자연의 이치',
        '자연은끊임없이순환한다', '자연은 끊임없이 순환한다',
        '우주의질서와무아', '우주의 질서와 무아'
    ]
    
    found = []
    for book in books:
        for ch in book['chapters']:
            for p_idx, p in enumerate(ch.get('paragraphs', [])):
                for sub in subtitles:
                    if sub in p:
                        found.append({
                            'book': book['title'],
                            'chapter': f"{ch['number']} {ch['title']}",
                            'p_idx': p_idx + 1,
                            'matched': sub,
                            'full_p': p
                        })
                        
    print(f"=== 소제목 본문 유입 전수 조사 결과: 총 {len(found)}건 ===")
    for idx, item in enumerate(found):
        print(f"[{idx+1}] [{item['book']} - {item['chapter']} (단락 {item['p_idx']})]")
        print(f"     발견 소제목: \"{item['matched']}\"")
        print(f"     단락 내용: \"{item['full_p'][:150]}...\"\n")

if __name__ == '__main__':
    check_all_leaks()

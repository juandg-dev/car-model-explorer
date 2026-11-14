import json,re,os,sys
# Checks one brand's collected data for mistakes. Usage (from the collection folder): python3 review.py honda
# ISSUES are things that are wrong (bad checksum, broken line, price or trim that differs between the options file and the spec page).
# INFO lines are things for Juan to look at (odd prices, the same item name twice on one trim, rules that point at an item a trim doesn't offer).
B=sys.argv[1] if len(sys.argv)>1 else 'honda'; issues=[]; info=[]
def ck(t):
    h=0
    for ch in t: h=(h*31+ord(ch))%1000000007
    return h
# A checksums (JS charCodeAt = UTF-16 units)
def ckjs(t):
    h=0
    b=t.encode('utf-16-le')
    for i in range(0,len(b),2): h=(h*31+int.from_bytes(b[i:i+2],'little'))%1000000007
    return h
for folder,cf in (('raw','checksums.json'),('specs','specs/checksums.json')):
    cs=json.load(open(f'{B}/{cf}'))
    for f,v in cs.items():
        t=open(f'{B}/{folder}/{f}',encoding='utf8').read().strip()
        if ckjs(t)!=v: issues.append(f'CHECKSUM {folder}/{f}: file {ckjs(t)} vs recorded {v}')
    missing=set(os.listdir(f'{B}/{folder}'))-set(cs)-{'checksums.json','outside-sources.json'}
    if missing: info.append(f'no recorded checksum: {folder} {sorted(missing)}')
# B raw format
raw={}
for f in sorted(os.listdir(f'{B}/raw')):
    L=open(f'{B}/raw/{f}',encoding='utf8').read().strip().split('\n')
    hd=L[0][1:].split('|'); T=[l.split(';') for l in L if l.startswith('T;')]; C=[l.split(';') for l in L if l.startswith('C;')]
    I=[l.split(';') for l in L if l[:2] in('P;','W;','E;','I;','L;','F;')]
    R=[l for l in L if l.startswith('R;')]
    raw[hd[0]]=dict(hd=hd,T=T,C=C,I=I,R=R,f=f)
    n=len(T); full=(1<<n)-1
    if len(hd)!=6: issues.append(f'{f}: header has {len(hd)} fields')
    other=[l for l in L[1:] if l[:2] not in('T;','C;','P;','W;','E;','I;','L;','F;','R;')]
    if other: issues.append(f'{f}: {len(other)} unrecognized lines, e.g. {other[0][:60]}')
    for t in T:
        if len(t)!=5 or not t[2].isdigit(): issues.append(f'{f}: bad trim line {t}')
    names=[t[1] for t in T]
    if len(set(names))!=n: issues.append(f'{f}: duplicate trim names')
    pr=[int(t[2]) for t in T]
    for c in C:
        if len(c)!=5: issues.append(f'{f}: bad paint line {c}'); continue
        ints=c[4].split(',')
        if len(ints)!=n: issues.append(f'{f}: paint "{c[1]}" has {len(ints)} interior entries for {n} trims')
        if all(x=='0' for x in ints): issues.append(f'{f}: paint "{c[1]}" offered on no trim')
        if not re.fullmatch(r'\d+(\.\d+)?',c[3]): issues.append(f'{f}: paint price {c[3]}')
    for i in range(n):
        if all(c[4].split(',')[i]=='0' for c in C if len(c)==5 and len(c[4].split(','))==n): issues.append(f'{f}: trim "{names[i]}" has no paint')
    seen={}
    for k,it in enumerate(I):
        if len(it)!=9: issues.append(f'{f}: item line {k} has {len(it)} fields: {it[1][:40]}'); continue
        cat,name,price,hrs,mask,x,req,inc,code=it
        try:
            p=float(price)
            if p!=int(p): info.append(f'{f}: non-round price ${price} "{name}"')
            if p<0: issues.append(f'{f}: negative price "{name}"')
            if p==0: info.append(f'{f}: $0 item "{name}" ({cat})')
        except: issues.append(f'{f}: price "{price}" for "{name}"')
        if not mask.isdigit() or int(mask)==0 or int(mask)>full: issues.append(f'{f}: trim mask {mask} (max {full}) for "{name}"')
        for lab,fld in (('x',x),('req',req),('inc',inc)):
            for v in filter(None,fld.split(',')):
                if not v.isdigit() or int(v)>=len(I): issues.append(f'{f}: {lab} index {v} out of range for "{name}"')
                elif int(v)==k: issues.append(f'{f}: "{name}" refers to itself in {lab}')
                elif lab in('req','inc') and mask.isdigit() and I[int(v)][4].isdigit() and int(mask)&~int(I[int(v)][4]): info.append(f'{f}: "{name}" {lab} "{I[int(v)][1]}" which is not offered on all the same trims')
        if hrs and float(hrs)>8: info.append(f'{f}: long install {hrs} h "{name}"')
        key=(name)
        if key in seen and seen[key]&int(mask) if mask.isdigit() else False: info.append(f'{f}: name used twice on the same trim: "{name}"')
        seen[key]=seen.get(key,0)|(int(mask) if mask.isdigit() else 0)
    # conflict symmetry
    for k,it in enumerate(I):
        if len(it)!=9: continue
        for v in filter(None,it[5].split(',')):
            if v.isdigit() and int(v)<len(I) and str(k) not in I[int(v)][5].split(','): info.append(f'{f}: one-way conflict "{it[1]}" -> "{I[int(v)][1]}"')
# C spec vs raw price/year
slug2id={v['hd'][3]:k for k,v in raw.items()}
spec={}
for f in sorted(os.listdir(f'{B}/specs')):
    if not f.endswith('.txt'): continue
    L=open(f'{B}/specs/{f}',encoding='utf8').read().strip().split('\n')
    hp=L[0][3:].split(' | '); slug,title,url=hp[0],' | '.join(hp[1:-1]),hp[-1]; trims=L[1].split('|'); prices=[int(re.sub(r'[^\d]','',(re.search(r'\$[\d,]+',p) or [''])[0] if re.search(r'\$[\d,]+',p) else '0') or 0) for p in L[2].split('|')]
    rows={}
    for l in L[3:]:
        c=l.split('|')
        if len(c)==len(trims)+1: rows.setdefault(c[0],c[1:])
    spec[slug]=dict(title=title,trims=trims,prices=prices,rows=rows)
    rid=slug2id.get(slug)
    if not rid: issues.append(f'specs/{f}: no options file with series {slug}'); continue
    r=raw[rid]; y=re.search(r'20\d\d',title)
    if y and y.group()!=r['hd'][2]: issues.append(f'{slug}: spec page is {y.group()}, options file is {r["hd"][2]}')
    for t,p in zip(trims,prices):
        cands=[(tt[1],int(tt[2])) for tt in r['T'] if tt[1]==t or tt[1].startswith(t+' ') ]
        if not cands: issues.append(f'{slug}: spec trim "{t}" not in options file (options trims: {[tt[1] for tt in r["T"]]})'); continue
        if p and p not in [c[1] for c in cands]: issues.append(f'{slug}: {t} price on spec page ${p:,} vs Build & Price {[f"{c[0]} ${c[1]:,}" for c in cands]}')
    for tt in r['T']:
        if not any(tt[1]==t or tt[1].startswith(t+' ') for t in trims): issues.append(f'{slug}: options trim "{tt[1]}" not on the spec page')
print('ISSUES',len(issues)); [print(' -',i) for i in issues]
print('INFO',len(info)); 
from collections import Counter
c=Counter(re.sub(r'".*','',i.split(': ',1)[1])[:40] for i in info); print(c)
[print(' .',i) for i in info if 'one-way' not in i and 'not offered on all' not in i]
print('one-way conflicts:',sum('one-way' in i for i in info),' req/inc trim mismatch:',sum('not offered on all' in i for i in info))
[print(' .',i) for i in info if 'not offered on all' in i]

import re,base64,os
src=open('dashboard.src.html',encoding='utf8').read()
def uri(path):
    ext=path.rsplit('.',1)[1]; mime='image/jpeg' if ext=='jpg' else 'image/png'
    return f'data:{mime};base64,'+base64.b64encode(open(path,'rb').read()).decode()
# static src="assets/x"
out=re.sub(r'src="(assets/[\w.]+)"',lambda m:f'src="{uri(m.group(1))}"',src)
# dynamic: img() helper builds assets/NAME.png at runtime -> replace with a lookup table
names=sorted({f[:-4] for f in os.listdir('assets') if f.endswith('.png') and not f.startswith('_') and f!='plate.png'})
table='const A={'+','.join(f'"{n}":"{uri("assets/"+n+".png")}"' for n in names)+'};'
out=re.sub(r'src="assets/\$\{n\}\.png"', 'src="${A[n]}"', out)
out=re.sub(r'const\s+img\s*=', table+'\nconst img = ', out, count=1)
open('dashboard.html','w',encoding='utf8').write(out)
print(len(out)//1024,'KB')

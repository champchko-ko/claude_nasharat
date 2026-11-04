import numpy as np, cv2
from PIL import Image
SRC='/mnt/user-data/uploads/1792933066647_image.png'
bgr=cv2.imread(SRC)
H,W=bgr.shape[:2]
OUT='assets'

# ---------- 1. regions to clean out of the background plate (text, numbers, icons) ----------
boxes=[
 (575,16,709,52),            # school name
 (214,26,248,45),            # language label
 (54,25,134,40),(56,41,108,53),   # user name / role
 (439,88,592,172),           # hero text
 # stat cards
 (64,232,136,250),(102,254,134,286),(140,226,174,264),
 (210,232,286,250),(252,256,280,288),(282,226,314,264),
 (358,232,412,250),(384,256,412,288),(412,226,448,264),
 (488,232,572,250),(536,254,572,288),(570,224,606,264),
 # activities card
 (578,323,652,341),
 (476,343,658,380),(476,385,658,422),(476,429,658,466),
 # events card
 (330,333,408,353),
 (222,350,412,394),(222,392,412,436),(222,434,412,478),
]
nav_y=[80,114,146,178,209,240,272,303,335,366]
for y in nav_y: boxes.append((684,y-14,826,y+14))
boxes.append((683,63,834,97))   # active pill

mask=np.zeros((H,W),np.uint8)
for (x0,y0,x1,y1) in boxes:
    roi=bgr[y0:y1,x0:x1]
    med=cv2.medianBlur(roi,21 if min(roi.shape[:2])>21 else 11)
    diff=np.abs(roi.astype(int)-med.astype(int)).sum(2)
    ink=(diff>22).astype(np.uint8)*255
    ink=cv2.dilate(ink,np.ones((5,5),np.uint8))
    mask[y0:y1,x0:x1]|=ink
plate=cv2.inpaint(bgr,mask,4,cv2.INPAINT_TELEA)
# second pass for leftovers on large areas (pill / hero text) -> blur-fill
plate=plate[2:493,:,:]            # drop the screenshot's 2px dark top strip + bottom artefact rows
cv2.imwrite(f'{OUT}/plate.png',plate)
print('plate',plate.shape)

# ---------- 2. keyed glyphs (icons) as transparent PNGs, taken from the ORIGINAL ----------
def key_glyph(box,name,mode='dist',scale=3):
    x0,y0,x1,y1=box
    roi=bgr[y0:y1,x0:x1].astype(float)
    corners=np.concatenate([roi[0,:],roi[-1,:],roi[:,0],roi[:,-1]])
    bg=np.median(corners,axis=0)
    d=np.sqrt(((roi-bg)**2).sum(2))
    a=np.clip((d-14)/60,0,1)
    out=np.dstack([roi,a*255]).astype(np.uint8)
    rgba=cv2.cvtColor(out[:,:,:3],cv2.COLOR_BGR2RGB)
    img=Image.fromarray(np.dstack([rgba,out[:,:,3]]),'RGBA')
    img=img.resize((img.width*scale,img.height*scale),Image.LANCZOS)
    img.save(f'{OUT}/{name}.png')

nav_icons=['home','circulars','homework','maintenance','calendar','info','settings','roles','audit','reports']
for n,y in zip(nav_icons,nav_y):
    key_glyph((797,y-13,823,y+13),f'nav_{n}')
key_glyph((144,230,172,262),'stat_file')
key_glyph((284,228,312,262),'stat_clip')
key_glyph((416,228,446,262),'stat_wrench')
key_glyph((572,226,604,262),'stat_bell')
for i,c in enumerate([361,403,447]):
    key_glyph((635-11,c-11,635+11,c+11),f'act_{i+1}')
for i,c in enumerate([372,413,455]):
    key_glyph((394-11,c-11,394+11,c+11),f'ev_{i+1}')
# chevron
key_glyph((226,368,238,384),'chev')
print('glyphs ok')

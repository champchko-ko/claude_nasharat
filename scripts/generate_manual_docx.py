import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, start=160, end=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{start}" w:type="dxa"/>'
        f'<w:right w:w="{end}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs can be top, bottom, left, right.
    val="single", sz="4", color="CCCCCC"
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            b_elm = parse_xml(
                f'<w:{edge} {nsdecls("w")} w:val="{edge_data.get("val", "single")}" '
                f'w:sz="{edge_data.get("sz", "4")}" w:space="0" '
                f'w:color="{edge_data.get("color", "CBD5E1")}"/>'
            )
            tcBorders.append(b_elm)
        else:
            b_elm = parse_xml(f'<w:{edge} {nsdecls("w")} w:val="none"/>')
            tcBorders.append(b_elm)
    tcPr.append(tcBorders)

def set_paragraph_bidi(p, rtl=True):
    pPr = p._p.get_or_add_pPr()
    if rtl:
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        bidi = parse_xml(f'<w:bidi {nsdecls("w")}/>')
        pPr.append(bidi)
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT

def add_run(p, text, font_name="Calibri", font_size=11, bold=False, italic=False, color_rgb=(30, 41, 59), rtl=False):
    run = p.add_run(text)
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)
    
    rPr = run._r.get_or_add_rPr()
    rFonts = parse_xml(
        f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>'
    )
    rPr.append(rFonts)
    if rtl:
        rPr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))
    return run

def set_table_bidi(table, rtl=True):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblPr = table._tbl.tblPr
    if rtl:
        tblPr.append(parse_xml(f'<w:bidiVisual {nsdecls("w")}/>'))

def create_callout_box(doc, title, text, rtl=True, fill_color="F1F5F9", border_color="2563EB"):
    tbl = doc.add_table(rows=1, cols=1)
    set_table_bidi(tbl, rtl)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=160, bottom=160, start=200, end=200)
    
    if rtl:
        set_cell_border(cell, right={"val": "single", "sz": "24", "color": border_color},
                              top={"val": "single", "sz": "4", "color": "E2E8F0"},
                              bottom={"val": "single", "sz": "4", "color": "E2E8F0"},
                              left={"val": "single", "sz": "4", "color": "E2E8F0"})
    else:
        set_cell_border(cell, left={"val": "single", "sz": "24", "color": border_color},
                              top={"val": "single", "sz": "4", "color": "E2E8F0"},
                              bottom={"val": "single", "sz": "4", "color": "E2E8F0"},
                              right={"val": "single", "sz": "4", "color": "E2E8F0"})
    
    p = cell.paragraphs[0]
    set_paragraph_bidi(p, rtl)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    add_run(p, title, font_name="Arial" if rtl else "Calibri", font_size=11, bold=True, color_rgb=(30, 58, 138), rtl=rtl)
    
    p2 = cell.add_paragraph()
    set_paragraph_bidi(p2, rtl)
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(0)
    add_run(p2, text, font_name="Arial" if rtl else "Calibri", font_size=10, bold=False, color_rgb=(51, 65, 85), rtl=rtl)
    
    # spacing after table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(6)

def main():
    doc = docx.Document()
    
    # Page Setup: Standard A4, 0.8 inch margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Document Title Block (Bilingual Banner)
    title_tbl = doc.add_table(rows=1, cols=1)
    title_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    title_cell = title_tbl.cell(0, 0)
    set_cell_background(title_cell, "1E3A8A") # Navy
    set_cell_margins(title_cell, top=260, bottom=260, start=300, end=300)
    set_cell_border(title_cell)
    
    tp1 = title_cell.paragraphs[0]
    set_paragraph_bidi(tp1, rtl=True)
    tp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp1.paragraph_format.space_after = Pt(4)
    add_run(tp1, "بوابة الإدارة المدرسية — الفهرس الرسمي لأدلة المستخدم", font_name="Arial", font_size=18, bold=True, color_rgb=(255, 255, 255), rtl=True)
    
    tp2 = title_cell.add_paragraph()
    set_paragraph_bidi(tp2, rtl=False)
    tp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp2.paragraph_format.space_after = Pt(4)
    add_run(tp2, "School Administration Portal — Official User Manuals Index", font_name="Calibri", font_size=13, bold=True, color_rgb=(224, 231, 255), rtl=False)
    
    tp3 = title_cell.add_paragraph()
    set_paragraph_bidi(tp3, rtl=True)
    tp3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tp3.paragraph_format.space_after = Pt(0)
    add_run(tp3, "دليل شامل لتشغيل وإدارة المنظومة من الصفر لكافة الأدوار التشغيلية والأكاديمية", font_name="Arial", font_size=10, bold=False, color_rgb=(191, 219, 254), rtl=True)

    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_before = Pt(8)
    spacer.paragraph_format.space_after = Pt(0)

    # =========================================================================
    # PART 1: ARABIC (RTL)
    # =========================================================================
    h1_ar = doc.add_paragraph()
    set_paragraph_bidi(h1_ar, rtl=True)
    h1_ar.paragraph_format.space_before = Pt(14)
    h1_ar.paragraph_format.space_after = Pt(4)
    add_run(h1_ar, "القسم الأول: دليل المستخدم العربي (شامل لكافة الأدوار)", font_name="Arial", font_size=14, bold=True, color_rgb=(30, 58, 138), rtl=True)

    p_intro_ar = doc.add_paragraph()
    set_paragraph_bidi(p_intro_ar, rtl=True)
    p_intro_ar.paragraph_format.space_before = Pt(4)
    p_intro_ar.paragraph_format.space_after = Pt(8)
    add_run(p_intro_ar, 
        "مرحباً بكم في الدليل التشغيلي الموحد لبوابة الإدارة المدرسية. تم تصميم المنظومة لتوفير حوكمة إدارية وأكاديمية متكاملة "
        "مبنية بالكامل على اللغة العربية (RTL) مع دعم كامل للغة الإنجليزية. تعتمد المنظومة مبدأ الفصل الصارم بين المسؤوليات "
        "والصلاحيات القائمة على الأدوار (RBAC)، حيث يعمل كل مستخدم ضمن مسارات وإجراءات مخصصة تضمن الدقة، الأمان، وسلاسة العمليات.",
        font_name="Arial", font_size=10.5, color_rgb=(51, 65, 85), rtl=True)

    # Section 1.1: Directory Table (Arabic)
    h2_ar_1 = doc.add_paragraph()
    set_paragraph_bidi(h2_ar_1, rtl=True)
    h2_ar_1.paragraph_format.space_before = Pt(10)
    h2_ar_1.paragraph_format.space_after = Pt(4)
    add_run(h2_ar_1, "1. الفهرس السريع: اختر دليل دورك الوظيفي", font_name="Arial", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=True)

    roles_data_ar = [
        ("1", "مالك المنصة\n(Platform Owner)", "المشرف العام / المستضيف للمنظومة", "1_Platform_Owner_Manual.md\nتهيئة المنظومة من الصفر، إنشاء المدارس، الحوكمة العليا، الإنجازات."),
        ("2", "مدير المدرسة\n(School Administrator)", "مدير المدرسة، المدير المساعد، الناظر الإداري", "2_School_Principal_Administrator_Manual.md\nإعداد ملف المدرسة، أيام العمل، الأقسام، المواقع، حسابات الكادر، التعاميم، الصيانة، التقارير."),
        ("3", "رئيس القسم\n(Department Head)", "رؤساء الأقسام الأكاديمية والإدارية", "3_Department_Head_Manual.md\nمتابعة التعاميم الموجهة للقسم، طباعة وتحميل المرفقات، تقديم الردود الرسمية، طلبات صيانة مرافق القسم."),
        ("4", "المعلم / الموظف\n(Teacher / Staff)", "المعلمون، الأخصائيون، الكادر الإداري", "4_Teacher_Staff_Manual.md\nلوحة المهام الشخصية، استلام التعاميم العامة، التقويم الدراسي والاختبارات، طلب صيانة الفصول مع الصور."),
        ("5", "فني الصيانة\n(Maintenance Operator)", "مشغلو الصيانة، الفنيون، مسؤولو الخدمات", "5_Maintenance_Technician_Manual.md\nقائمة أوامر العمل عبر الهاتف، تحديث حالات الصيانة، تسجيل الملاحظات الفنية، رفع صور الإنجاز.")
    ]

    tbl_roles_ar = doc.add_table(rows=len(roles_data_ar) + 1, cols=4)
    set_table_bidi(tbl_roles_ar, rtl=True)
    
    headers_ar = ["#", "الدور الوظيفي", "الفئة المستهدفة", "المسؤوليات الرئيسية ورابط الدليل"]
    col_widths_ar = [Inches(0.5), Inches(1.8), Inches(2.0), Inches(2.8)]

    # Header Row
    for col_idx, text in enumerate(headers_ar):
        cell = tbl_roles_ar.cell(0, col_idx)
        cell.width = col_widths_ar[col_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=140, bottom=140, start=140, end=140)
        set_cell_border(cell, top={"val": "single", "sz": "6", "color": "1E3A8A"},
                              bottom={"val": "single", "sz": "12", "color": "0F172A"},
                              left={"val": "single", "sz": "4", "color": "3B82F6"},
                              right={"val": "single", "sz": "4", "color": "3B82F6"})
        p = cell.paragraphs[0]
        set_paragraph_bidi(p, rtl=True)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_run(p, text, font_name="Arial", font_size=10, bold=True, color_rgb=(255, 255, 255), rtl=True)

    # Data Rows
    for row_idx, data in enumerate(roles_data_ar, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = tbl_roles_ar.cell(row_idx, col_idx)
            cell.width = col_widths_ar[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=120, bottom=120, start=140, end=140)
            set_cell_border(cell, top={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  bottom={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  left={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  right={"val": "single", "sz": "4", "color": "E2E8F0"})
            p = cell.paragraphs[0]
            set_paragraph_bidi(p, rtl=True)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                add_run(p, text, font_name="Arial", font_size=10, bold=True, color_rgb=(30, 41, 59), rtl=True)
            elif col_idx == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                add_run(p, text, font_name="Arial", font_size=9.5, bold=True, color_rgb=(30, 58, 138), rtl=True)
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                add_run(p, text, font_name="Arial", font_size=9.5, bold=False, color_rgb=(51, 65, 85), rtl=True)

    # Section 1.2: Permissions Matrix (Arabic)
    doc.add_paragraph()
    h2_ar_2 = doc.add_paragraph()
    set_paragraph_bidi(h2_ar_2, rtl=True)
    h2_ar_2.paragraph_format.space_before = Pt(12)
    h2_ar_2.paragraph_format.space_after = Pt(4)
    add_run(h2_ar_2, "2. مصفوفة الصلاحيات والمسارات المتاحة لكل دور", font_name="Arial", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=True)

    matrix_data_ar = [
        ("لوحة التحكم الشخصية (/dashboard)", "شامل لكافة المدارس", "عمليات المدرسة كاملة", "مهام القسم المستهدفة", "المهام والتعاميم الشخصية", "قائمة أوامر العمل"),
        ("إعدادات المدرسة (/settings/*)", "قراءة وتدقيق أمني", "تحكم وإعداد كامل", "غير متاح", "غير متاح", "غير متاح"),
        ("إدارة المستخدمين والأدوار (/settings/users)", "نطاق المنصة بالكامل", "نطاق كادر المدرسة", "غير متاح", "غير متاح", "غير متاح"),
        ("إدارة التعاميم المدرسية (/circulars)", "إشراف كامل", "إنشاء، تعديل، حذف", "اطلاع ورد رسمي", "اطلاع وتأكيد استلام", "اطلاع فقط"),
        ("تقارير الامتثال والتحليلات (/reports)", "اطلاع وتصدير Excel", "اطلاع وتصدير Excel", "غير متاح (محجوب)", "غير متاح (محجوب)", "غير متاح (محجوب)"),
        ("طلبات الصيانة والمرافق (/maintenance)", "رقابة كاملة", "فرز وتعيين الفنيين", "تقديم ومتابعة للقسم", "تقديم ومتابعة للفصل", "تنفيذ وتحديث الحالات"),
        ("التقويم المدرسي (/calendar)", "إدارة كاملة", "إنشاء وتعديل الفعاليات", "اطلاع وتصفية", "اطلاع وتصفية", "اطلاع وتصفية"),
        ("إنجازات المدرسة (/achievements)", "وصول حصري للمالك", "محجوب تماماً", "محجوب تماماً", "محجوب تماماً", "محجوب تماماً")
    ]

    tbl_matrix_ar = doc.add_table(rows=len(matrix_data_ar) + 1, cols=6)
    set_table_bidi(tbl_matrix_ar, rtl=True)
    matrix_headers_ar = ["الميزة / المسار", "مالك المنصة", "مدير المدرسة", "رئيس القسم", "المعلم / الموظف", "فني الصيانة"]
    col_w_m_ar = [Inches(1.8), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1)]

    for col_idx, text in enumerate(matrix_headers_ar):
        cell = tbl_matrix_ar.cell(0, col_idx)
        cell.width = col_w_m_ar[col_idx]
        set_cell_background(cell, "0F766E") # Teal-800
        set_cell_margins(cell, top=120, bottom=120, start=100, end=100)
        set_cell_border(cell, top={"val": "single", "sz": "6", "color": "0F766E"},
                              bottom={"val": "single", "sz": "10", "color": "134E4A"},
                              left={"val": "single", "sz": "4", "color": "14B8A6"},
                              right={"val": "single", "sz": "4", "color": "14B8A6"})
        p = cell.paragraphs[0]
        set_paragraph_bidi(p, rtl=True)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_run(p, text, font_name="Arial", font_size=9, bold=True, color_rgb=(255, 255, 255), rtl=True)

    for row_idx, data in enumerate(matrix_data_ar, start=1):
        bg = "F0FDFA" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = tbl_matrix_ar.cell(row_idx, col_idx)
            cell.width = col_w_m_ar[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, start=100, end=100)
            set_cell_border(cell, top={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  bottom={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  left={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  right={"val": "single", "sz": "4", "color": "CCFBF1"})
            p = cell.paragraphs[0]
            set_paragraph_bidi(p, rtl=True)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                add_run(p, text, font_name="Arial", font_size=8.5, bold=True, color_rgb=(15, 23, 42), rtl=True)
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                color = (185, 28, 28) if "محجوب" in text or "غير متاح" in text else (15, 118, 110) if "كامل" in text or "وصول" in text else (51, 65, 85)
                add_run(p, text, font_name="Arial", font_size=8.5, bold=False, color_rgb=color, rtl=True)

    # Section 1.3: FAQ (Arabic)
    doc.add_paragraph()
    h2_ar_3 = doc.add_paragraph()
    set_paragraph_bidi(h2_ar_3, rtl=True)
    h2_ar_3.paragraph_format.space_before = Pt(12)
    h2_ar_3.paragraph_format.space_after = Pt(4)
    add_run(h2_ar_3, "3. الأسئلة الشائعة والدعم الفني المباشر", font_name="Arial", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=True)

    create_callout_box(
        doc,
        title="س: كيف يتم التبديل بين اللغتين العربية والإنجليزية؟",
        text="ج: انقر على زر اللغة (العربية / English) في شريط التنقل العلوي في أي وقت. يتم تحويل واجهة المستخدم فورياً وسلاسة بين الاتجاه الأيمن (RTL) والأيسر (LTR) مع الحفاظ على الصفحة الحالية.",
        rtl=True,
        fill_color="EFF6FF",
        border_color="2563EB"
    )

    create_callout_box(
        doc,
        title="س: ماذا أفعل إذا نسيت كلمة المرور الخاصة بحسابي؟",
        text="ج: من صفحة تسجيل الدخول (/login)، انقر فوق رابط (نسيت كلمة المرور؟). أدخل بريدك الإلكتروني المسجل وستصلك رسالة فورية تتضمن رابطاً آمناً لتعيين كلمة مرور جديدة دون الحاجة لمراجعة إدارة المدرسة.",
        rtl=True,
        fill_color="F0FDF4",
        border_color="16A34A"
    )

    create_callout_box(
        doc,
        title="س: كيف تعمل الإشعارات الفورية الحية (Real-Time Push Notifications)؟",
        text="ج: بمجرد قيام الإدارة بنشر تعميم يخص قسمك أو إسناد طلب صيانة لك، يظهر إشعار تفاعلي (Toast) على شاشتك فوراً عبر تقنية WebSockets مع رابط مباشر للمهمة، كما يتحدث عداد الجرس تلقائياً دون الحاجة لتحديث الصفحة.",
        rtl=True,
        fill_color="FEF3C7",
        border_color="D97706"
    )

    # =========================================================================
    # PART 2: ENGLISH (LTR) - PAGE BREAK
    # =========================================================================
    doc.add_page_break()

    h1_en = doc.add_paragraph()
    set_paragraph_bidi(h1_en, rtl=False)
    h1_en.paragraph_format.space_before = Pt(14)
    h1_en.paragraph_format.space_after = Pt(4)
    add_run(h1_en, "Part Two: Official User Manuals Index (English Version)", font_name="Calibri", font_size=14, bold=True, color_rgb=(30, 58, 138), rtl=False)

    p_intro_en = doc.add_paragraph()
    set_paragraph_bidi(p_intro_en, rtl=False)
    p_intro_en.paragraph_format.space_before = Pt(4)
    p_intro_en.paragraph_format.space_after = Pt(8)
    add_run(p_intro_en, 
        "Welcome to the official user manual repository for the School Administration Portal. "
        "The portal is an enterprise-grade, Arabic-first school operations and governance system built with Next.js 16, "
        "PostgreSQL Row Level Security (RLS), and Supabase. The portal strictly enforces zero-trust separation of duties "
        "and Role-Based Access Control (RBAC), ensuring each user persona operates within an isolated, streamlined workflow.",
        font_name="Calibri", font_size=10.5, color_rgb=(51, 65, 85), rtl=False)

    # Section 2.1: Directory Table (English)
    h2_en_1 = doc.add_paragraph()
    set_paragraph_bidi(h2_en_1, rtl=False)
    h2_en_1.paragraph_format.space_before = Pt(10)
    h2_en_1.paragraph_format.space_after = Pt(4)
    add_run(h2_en_1, "1. Quick Directory: Choose Your Role Manual", font_name="Calibri", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=False)

    roles_data_en = [
        ("1", "Platform Owner\n(owner)", "Super Administrator / System Host", "1_Platform_Owner_Manual.md\nSystem bootstrap from empty app, school tenant provisioning, multi-tenant governance, achievements."),
        ("2", "School Administrator\n(school_admin)", "Principal, Assistant Principal, Admin Deputy", "2_School_Principal_Administrator_Manual.md\nEmpty-app setup, school profile, workweek days, departments, locations, user accounts, circulars, maintenance, reports."),
        ("3", "Department Head\n(department_head)", "Heads of Academic & Admin Departments", "3_Department_Head_Manual.md\nReviewing scoped circulars, downloading/printing attachments, formal department responses, lab/room repairs."),
        ("4", "Teacher / Staff\n(staff)", "Faculty, Teachers, Counselors, Staff", "4_Teacher_Staff_Manual.md\nDaily dashboard routine, acknowledging general circulars, academic calendar and exams, reporting classroom repairs with photos."),
        ("5", "Maintenance Operator\n(operator)", "Facilities Operators, Technicians, Services", "5_Maintenance_Technician_Manual.md\nMobile work order queue, state transitions (assigned -> in_progress -> completed), work notes, photo proof uploads.")
    ]

    tbl_roles_en = doc.add_table(rows=len(roles_data_en) + 1, cols=4)
    set_table_bidi(tbl_roles_en, rtl=False)
    headers_en = ["#", "Role / Persona", "Target Audience", "Primary Responsibilities & Guide Link"]
    col_widths_en = [Inches(0.5), Inches(1.8), Inches(2.0), Inches(2.8)]

    for col_idx, text in enumerate(headers_en):
        cell = tbl_roles_en.cell(0, col_idx)
        cell.width = col_widths_en[col_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=140, bottom=140, start=140, end=140)
        set_cell_border(cell, top={"val": "single", "sz": "6", "color": "1E3A8A"},
                              bottom={"val": "single", "sz": "12", "color": "0F172A"},
                              left={"val": "single", "sz": "4", "color": "3B82F6"},
                              right={"val": "single", "sz": "4", "color": "3B82F6"})
        p = cell.paragraphs[0]
        set_paragraph_bidi(p, rtl=False)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_run(p, text, font_name="Calibri", font_size=10, bold=True, color_rgb=(255, 255, 255), rtl=False)

    for row_idx, data in enumerate(roles_data_en, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = tbl_roles_en.cell(row_idx, col_idx)
            cell.width = col_widths_en[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=120, bottom=120, start=140, end=140)
            set_cell_border(cell, top={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  bottom={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  left={"val": "single", "sz": "4", "color": "E2E8F0"},
                                  right={"val": "single", "sz": "4", "color": "E2E8F0"})
            p = cell.paragraphs[0]
            set_paragraph_bidi(p, rtl=False)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                add_run(p, text, font_name="Calibri", font_size=10, bold=True, color_rgb=(30, 41, 59), rtl=False)
            elif col_idx == 1:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                add_run(p, text, font_name="Calibri", font_size=9.5, bold=True, color_rgb=(30, 58, 138), rtl=False)
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                add_run(p, text, font_name="Calibri", font_size=9.5, bold=False, color_rgb=(51, 65, 85), rtl=False)

    # Section 2.2: Matrix (English)
    doc.add_paragraph()
    h2_en_2 = doc.add_paragraph()
    set_paragraph_bidi(h2_en_2, rtl=False)
    h2_en_2.paragraph_format.space_before = Pt(12)
    h2_en_2.paragraph_format.space_after = Pt(4)
    add_run(h2_en_2, "2. Role Permissions & Accessible Routes Matrix", font_name="Calibri", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=False)

    matrix_data_en = [
        ("Dashboard (/dashboard)", "Full Platform", "School Operations", "Department Focus", "Personal Tasks", "Work Order Queue"),
        ("School Settings (/settings/*)", "Read/Audit", "Full Access", "No Access", "No Access", "No Access"),
        ("Users & Roles (/settings/users)", "System Scope", "School Staff Scope", "No Access", "No Access", "No Access"),
        ("Circulars (/circulars)", "Full Manage", "Create, Edit, Delete", "View & Respond", "View & Acknowledge", "View Only"),
        ("Reports & Analytics (/reports)", "View & Export CSV", "View & Export CSV", "Hidden / No Access", "Hidden / No Access", "Hidden / No Access"),
        ("Maintenance (/maintenance)", "Full Oversight", "Triage & Assign", "Submit & Track", "Submit & Track", "Execute & Update"),
        ("School Calendar (/calendar)", "Full Manage", "Create & Edit", "View & Filter", "View & Filter", "View & Filter"),
        ("Achievements (/achievements)", "Exclusive Access", "Hidden", "Hidden", "Hidden", "Hidden")
    ]

    tbl_matrix_en = doc.add_table(rows=len(matrix_data_en) + 1, cols=6)
    set_table_bidi(tbl_matrix_en, rtl=False)
    matrix_headers_en = ["Feature / Route", "Platform Owner", "School Admin", "Dept Head", "Teacher / Staff", "Operator"]

    for col_idx, text in enumerate(matrix_headers_en):
        cell = tbl_matrix_en.cell(0, col_idx)
        cell.width = col_w_m_ar[col_idx]
        set_cell_background(cell, "0F766E")
        set_cell_margins(cell, top=120, bottom=120, start=100, end=100)
        set_cell_border(cell, top={"val": "single", "sz": "6", "color": "0F766E"},
                              bottom={"val": "single", "sz": "10", "color": "134E4A"},
                              left={"val": "single", "sz": "4", "color": "14B8A6"},
                              right={"val": "single", "sz": "4", "color": "14B8A6"})
        p = cell.paragraphs[0]
        set_paragraph_bidi(p, rtl=False)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_run(p, text, font_name="Calibri", font_size=9, bold=True, color_rgb=(255, 255, 255), rtl=False)

    for row_idx, data in enumerate(matrix_data_en, start=1):
        bg = "F0FDFA" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = tbl_matrix_en.cell(row_idx, col_idx)
            cell.width = col_w_m_ar[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, start=100, end=100)
            set_cell_border(cell, top={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  bottom={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  left={"val": "single", "sz": "4", "color": "CCFBF1"},
                                  right={"val": "single", "sz": "4", "color": "CCFBF1"})
            p = cell.paragraphs[0]
            set_paragraph_bidi(p, rtl=False)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                add_run(p, text, font_name="Calibri", font_size=8.5, bold=True, color_rgb=(15, 23, 42), rtl=False)
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                color = (185, 28, 28) if "Hidden" in text or "No Access" in text else (15, 118, 110) if "Full" in text or "Exclusive" in text else (51, 65, 85)
                add_run(p, text, font_name="Calibri", font_size=8.5, bold=False, color_rgb=color, rtl=False)

    # Section 2.3: FAQ (English)
    doc.add_paragraph()
    h2_en_3 = doc.add_paragraph()
    set_paragraph_bidi(h2_en_3, rtl=False)
    h2_en_3.paragraph_format.space_before = Pt(12)
    h2_en_3.paragraph_format.space_after = Pt(4)
    add_run(h2_en_3, "3. General Support & Frequently Asked Questions (FAQ)", font_name="Calibri", font_size=12, bold=True, color_rgb=(15, 23, 42), rtl=False)

    create_callout_box(
        doc,
        title="Q1: How do I switch between Arabic and English?",
        text="Click the language toggle (العربية / English) in the top navigation bar at any time. The interface dynamically switches between RTL (Right-to-Left) and LTR (Left-to-Right) layouts while preserving your current view.",
        rtl=False,
        fill_color="EFF6FF",
        border_color="2563EB"
    )

    create_callout_box(
        doc,
        title="Q2: How do I reset a forgotten password?",
        text="On the login screen (/login), click the 'Forgot password?' link. Enter your registered email address to receive an instant, secure reset link via email, allowing you to update your password without administrative intervention.",
        rtl=False,
        fill_color="F0FDF4",
        border_color="16A34A"
    )

    create_callout_box(
        doc,
        title="Q3: How do Real-Time Push Notifications work?",
        text="When an administrator publishes a circular targeted to your department or assigns a maintenance ticket to your queue, an interactive toast notification appears on your screen in real time over WebSockets. Clicking the toast takes you directly to the relevant record.",
        rtl=False,
        fill_color="FEF3C7",
        border_color="D97706"
    )

    output_path = os.path.abspath(r"c:\Users\ahmed\Desktop\School_Administration_Portal\docs\manuals\USER_MANUAL_INDEX.docx")
    doc.save(output_path)
    print(f"Successfully generated DOCX file at: {output_path}")

if __name__ == "__main__":
    main()

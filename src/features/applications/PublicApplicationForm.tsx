import { FormEvent, useState } from "react";
import { FileUp, Send, Baby, UserCheck, FileText, ArrowRight, ArrowLeft, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { createPublicApplication } from "./application.service";
import type { Gender, OrphanType } from "../../types/orphan.types";
import { QuranVersePopup } from "../../components/ui/QuranVersePopup";

const governorates = ["شمال غزة", "غزة", "الوسطى", "خانيونس", "رفح", "نابلس", "رام الله والبيرة", "الخليل", "جنين", "طولكرم", "قلقيلية", "بيت Bethlehem", "سلفيت", "طوباس", "أريحا", "القدس"];

export function PublicApplicationForm() {
  const [step, setStep] = useState(1);
  const [childFullName, setChildFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("ذكر");
  const [orphanType, setOrphanType] = useState<OrphanType>("يتيم الأب");
  const [governorateCity, setGovernorateCity] = useState("غزة");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("الأم");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const validateStep = (currentStep: number) => {
    setMessage("");
    if (currentStep === 1) {
      if (!childFullName.trim()) {
        setMessage("يرجى إدخال الاسم الرباعي للطفل بشكل صحيح.");
        return false;
      }
      if (!birthDate) {
        setMessage("يرجى إدخال تاريخ ميلاد الطفل.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!guardianName.trim()) {
        setMessage("يرجى إدخال اسم الوصي بالكامل.");
        return false;
      }
      if (!guardianPhone.trim() || guardianPhone.trim().length < 9) {
        setMessage("يرجى إدخال رقم جوال صحيح للتواصل عبره.");
        return false;
      }
      if (!address.trim()) {
        setMessage("يرجى توضيح عنوان ومكان السكن بالتفصيل.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setMessage("");
    setStep((prev) => prev - 1);
  };

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(Array.from(e.dataTransfer.files));
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (files.length === 0) {
      setMessage("يرجى رفع المستندات الثبوتية المطلوبة (مثل شهادة الميلاد أو شهادة الوفاة) للمتابعة.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createPublicApplication(
        {
          childFullName,
          birthDate,
          sponsorName: "",
          sponsorshipAmount: null,
          sponsorPhone: "",
          guardianName,
          guardianRelation,
          guardianPhone,
          orphanType,
          address,
          transferAccountName: "",
          transferAccountNumber: "",
          documentsStatus: "مرفوعة بانتظار المراجعة",
          governorateCity,
          gender,
          currency: "شيكل",
        },
        files,
        (progress) => setUploadProgress(progress)
      );

      setIsSuccess(true);
      resetForm();
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء إرسال الطلب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  function resetForm() {
    setChildFullName("");
    setBirthDate("");
    setAddress("");
    setGuardianName("");
    setGuardianRelation("الأم");
    setGuardianPhone("");
    setFiles([]);
    setUploadProgress(0);
  }

  function startAnother() {
    setIsSuccess(false);
    setStep(1);
    setMessage("");
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Intro visual header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 mb-4 border border-blue-100">
          <Baby className="h-3.5 w-3.5" />
          البوابة الآمنة لتسجيل الأيتام
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
          تقديم طلب كفالة يتيم بطريقة سهلة وسرية
        </h1>
        <p className="mt-3 text-sm md:text-base text-slate-500 leading-relaxed font-medium">
          هذا النموذج مخصص للأمهات والأوصياء. تُرفع المستندات بأمان تام إلى خوادمنا وتُراجع من قِبل إدارة المؤسسة لاعتمادها ضمن سجلات الكفالات الرسمية.
        </p>
      </div>

      {isSuccess ? (
        // Success State Page
        <div className="glass-card max-w-2xl mx-auto p-8 md:p-12 text-center animate-fade-in">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-soft">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">تم إرسال الطلب بنجاح!</h2>
          <p className="mt-4 text-sm md:text-base leading-8 text-slate-600 font-medium">
            نشكركم على ثقتكم. لقد تم إدخال الطلب بحالة <strong className="text-emerald-600">جديد بانتظار المراجعة</strong>، وحفظ الملفات الثبوتية بنجاح. سيقوم المنسق المختص بمطابقة البيانات والتواصل معكم عبر الهاتف المرفق لإكمال الإجراءات الرسمية.
          </p>
          
          <div className="mt-8 flex justify-center">
            <button onClick={startAnother} className="primary-btn px-8">
              تقديم طلب ليتيم آخر
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_2.2fr] items-start">
          
          {/* Instructions and Steps Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-base font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">خطوات إرسال الطلب</h3>
              
              {/* Vertical Stepper UI */}
              <div className="relative flex flex-col gap-6">
                {/* Visual Line */}
                <div className="absolute right-5 top-5 bottom-5 w-0.5 bg-slate-200/70 -z-10" />

                {/* Step 1 Item */}
                <div className="flex items-start gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl font-black text-sm transition-all duration-300 ${
                    step === 1 ? "bg-blue-600 text-white shadow-soft ring-4 ring-blue-100 scale-105" : 
                    step > 1 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Baby className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${step === 1 ? "text-blue-600" : "text-slate-800"}`}>الخطوة الأولى</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">بيانات اليتيم الأساسية</p>
                  </div>
                </div>

                {/* Step 2 Item */}
                <div className="flex items-start gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl font-black text-sm transition-all duration-300 ${
                    step === 2 ? "bg-blue-600 text-white shadow-soft ring-4 ring-blue-100 scale-105" : 
                    step > 2 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${step === 2 ? "text-blue-600" : "text-slate-800"}`}>الخطوة الثانية</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">بيانات الوصي ومكان السكن</p>
                  </div>
                </div>

                {/* Step 3 Item */}
                <div className="flex items-start gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl font-black text-sm transition-all duration-300 ${
                    step === 3 ? "bg-blue-600 text-white shadow-soft ring-4 ring-blue-100 scale-105" : "bg-slate-100 text-slate-400"
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${step === 3 ? "text-blue-600" : "text-slate-800"}`}>الخطوة الثالثة</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">الأوراق الثبوتية والاعتماد</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 bg-slate-900 text-white/90">
              <h4 className="text-sm font-black mb-2 text-white">🔒 حماية كاملة للخصوصية</h4>
              <p className="text-xs leading-6 text-slate-300 font-medium">
                تلتزم المؤسسة بأقصى درجات السرية والخصوصية. بيانات الأيتام والأسر مشفرة ولا يتم مشاركتها أو استخدامها لأي أغراض خارج نطاق الكفالة والمساعدات الإنسانية الرسمية.
              </p>
            </div>
          </div>

          {/* Form Content panel */}
          <div className="glass-card p-6 md:p-8">
            {message && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto rounded-3xl border border-rose-200/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl px-6 py-5 max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 grid h-10 w-10 place-items-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">تنبيه</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
                    </div>
                    <button onClick={() => setMessage("")} className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: Orphan details */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2 mb-2">بيانات اليتيم الأساسية</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">اسم الطفل كامل رباعي <span className="text-rose-500">*</span></label>
                      <input className="glass-input" value={childFullName} onChange={(e) => setChildFullName(e.target.value)} placeholder="مثال: أحمد محمد علي حسن" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">تاريخ الميلاد <span className="text-rose-500">*</span></label>
                      <input className="glass-input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">الجنس <span className="text-rose-500">*</span></label>
                      <select className="glass-input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                        <option>ذكر</option>
                        <option>أنثى</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">حالة اليتيم <span className="text-rose-500">*</span></label>
                      <select className="glass-input" value={orphanType} onChange={(e) => setOrphanType(e.target.value as OrphanType)}>
                        <option>يتيم الأب</option>
                        <option>يتيم الأم</option>
                        <option>يتيم الأبوين</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Guardian and address */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2 mb-2">بيانات الوصي والاتصال</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">اسم الوصي بالكامل <span className="text-rose-500">*</span></label>
                      <input className="glass-input" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="الاسم الكامل للوصي القانوني" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">صلة قرابة الوصي بالطفل <span className="text-rose-500">*</span></label>
                      <input className="glass-input" value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} placeholder="مثال: الأم، الجد، العم" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">رقم جوال للتواصل الوصي <span className="text-rose-500">*</span></label>
                      <input className="glass-input text-left" type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="05xxxxxxxx" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">المحافظة / المدينة <span className="text-rose-500">*</span></label>
                      <select className="glass-input" value={governorateCity} onChange={(e) => setGovernorateCity(e.target.value)}>
                        {governorates.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-black text-slate-700">مكان السكن الحالي بالتفصيل <span className="text-rose-500">*</span></label>
                      <input className="glass-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الحي، الشارع، المعالم القريبة" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Documents and Review */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Visual recap grid */}
                  <div>
                    <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      مراجعة البيانات المدخلة قبل الإرسال
                    </h3>
                    <div className="grid gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 md:grid-cols-2">
                      <div><span className="text-slate-400 font-bold block mb-0.5">اسم الطفل:</span> {childFullName}</div>
                      <div><span className="text-slate-400 font-bold block mb-0.5">تاريخ الميلاد:</span> {birthDate} ({gender} - {orphanType})</div>
                      <div><span className="text-slate-400 font-bold block mb-0.5">الوصي والقرابة:</span> {guardianName} ({guardianRelation})</div>
                      <div><span className="text-slate-400 font-bold block mb-0.5">الهاتف والمدينة:</span> {guardianPhone} ({governorateCity})</div>
                      <div className="md:col-span-2"><span className="text-slate-400 font-bold block mb-0.5">العنوان بالتفصيل:</span> {address}</div>
                    </div>
                  </div>

                  {/* Documents drag and drop */}
                  <div>
                    <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <FileUp className="h-4 w-4 text-blue-500" />
                      إرفاق المستندات الثبوتية <span className="text-rose-500">*</span>
                    </h3>
                    
                    <p className="text-xs text-slate-400 font-medium mb-3">
                      يرجى إرفاق شهادة ميلاد الطفل ووفاة الأب/الأبوين أو أي أوراق رسمية داعمة للطلب بصيغة صور أو PDF.
                    </p>

                    {/* Custom Premium File Input Dropzone */}
                    <div 
                      className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer group ${
                        isDragActive 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white/70 dark:bg-slate-800/70"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        type="file" 
                        multiple 
                        accept="image/*,.pdf" 
                        onChange={(e) => e.target.files && handleFileChange(Array.from(e.target.files))} 
                      />
                      <FileUp className={`mx-auto h-10 w-10 transition duration-300 ${isDragActive ? "text-blue-600 scale-110" : "text-slate-300 group-hover:text-blue-500 group-hover:-translate-y-1"}`} />
                      <p className={`mt-3 text-xs font-black ${isDragActive ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {isDragActive ? "أفلت الملفات هنا..." : "اسحب الملفات وأفلتها هنا، أو اضغط للتصفح"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400 font-bold">يمكن اختيار ملفات متعددة (صور أو ملفات PDF حتى 5 ميغابايت)</p>
                    </div>

                    {/* Selected files preview */}
                    {files.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <h4 className="text-xs font-black text-slate-700">الملفات المرفقة ({files.length}):</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm animate-fade-in group">
                              
                              {/* Thumbnail preview if image */}
                              {file.type.startsWith("image/") ? (
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt="preview" 
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-100 shrink-0"
                                />
                              ) : (
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 border border-red-100 shrink-0">
                                  <FileText className="h-5 w-5" />
                                </div>
                              )}
                              
                              <div className="min-w-0 flex-grow">
                                <p className="text-xs font-black text-slate-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatFileSize(file.size)}</p>
                              </div>

                              <button 
                                type="button"
                                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                onClick={() => removeFile(idx)}
                                title="إزالة الملف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Wizard navigation controls */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={handleBack} 
                    className="secondary-btn"
                    disabled={isSubmitting}
                  >
                    <ArrowRight className="h-4 w-4" />
                    السابق
                  </button>
                ) : (
                  <div /> // Placeholder to maintain flex alignment
                )}

                {step < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="primary-btn px-6"
                  >
                    التالي
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-end gap-4">
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="flex-1 max-w-[200px] flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{uploadProgress}%</span>
                      </div>
                    )}
                    <button 
                      type="submit" 
                      className="primary-btn px-8" 
                      disabled={isSubmitting}
                    >
                      <Send className={`h-4 w-4 ${isSubmitting ? "animate-bounce" : ""}`} />
                      {isSubmitting ? "جاري رفع الملفات والإرسال..." : "إرسال طلب الكفالة"}
                    </button>
                  </div>
                )}

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quranic Verses Popup */}
      <QuranVersePopup />
    </section>
  );
}

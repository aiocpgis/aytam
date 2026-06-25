import { FormEvent, useEffect, useRef, useState } from "react";
import { FileUp, Send, Baby, UserCheck, FileText, ArrowRight, ArrowLeft, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { createPublicApplication } from "./application.service";
import type { Gender, OrphanType } from "../../types/orphan.types";
import { QuranVersePopup } from "../../components/ui/QuranVersePopup";
import { containsXss, sanitizeInput } from "../../lib/utils";

const governorates = ["شمال غزة", "غزة", "الوسطى", "خانيونس", "رفح", "نابلس", "رام الله والبيرة", "الخليل", "جنين", "طولكرم", "قلقيلية", "بيت Bethlehem", "سلفيت", "طوباس", "أريحا", "القدس"];
const transferAccountOptions = ["بنك فلسطين", "بال باي", "جوال باي"] as const;

type TransferAccountOption = (typeof transferAccountOptions)[number];
type PublicSponsorshipStatus = "غير مكفول" | "مكفول";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOldestAllowedBirthDate() {
  const today = new Date();
  const oldestAllowed = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate() + 1);
  return formatDateInput(oldestAllowed);
}

function calculateAgeInYears(dateValue: string) {
  const birth = new Date(`${dateValue}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(birth.getTime()) || birth > today) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

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
  const [transferAccountName, setTransferAccountName] = useState<TransferAccountOption>("بنك فلسطين");
  const [transferAccountNumber, setTransferAccountNumber] = useState("");
  const [sponsorshipStatus, setSponsorshipStatus] = useState<PublicSponsorshipStatus>("غير مكفول");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorCountry, setSponsorCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>({});
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, []);

  const todayInputValue = formatDateInput(new Date());
  const oldestAllowedBirthDate = getOldestAllowedBirthDate();

  const validateStep = (currentStep: number) => {
    setMessage("");

    if (currentStep === 1) {
      if (!childFullName.trim()) {
        setMessage("يرجى إدخال الاسم الرباعي للطفل بشكل صحيح.");
        return false;
      }

      if (containsXss(childFullName)) {
        setMessage("يحتوي اسم الطفل على مدخلات غير صالحة أو غير آمنة.");
        return false;
      }

      if (!birthDate) {
        setMessage("يرجى إدخال تاريخ ميلاد الطفل.");
        return false;
      }

      const age = calculateAgeInYears(birthDate);
      if (age === null) {
        setMessage("يرجى إدخال تاريخ ميلاد صحيح وغير مستقبلي.");
        return false;
      }

      if (age > 15) {
        setMessage("طلب الكفالة في النموذج العام مخصص للأطفال من عمر 15 سنة فأقل فقط.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!guardianName.trim()) {
        setMessage("يرجى إدخال اسم الوصي بالكامل.");
        return false;
      }

      if (containsXss(guardianName) || containsXss(address) || containsXss(notes)) {
        setMessage("تحتوي بعض الحقول المدخلة على رموز غير آمنة أو أكواد غير مصرح بها.");
        return false;
      }

      const phoneClean = guardianPhone.trim().replace(/[-\s]/g, "");
      const phoneRegex = /^(05\d{8}|9705\d{8}|9725\d{8}|\+9705\d{8}|\+9725\d{8})$/;
      if (!phoneRegex.test(phoneClean)) {
        setMessage("يرجى إدخال رقم جوال وصي صحيح (مثال: 0599000000).");
        return false;
      }

      if (!address.trim()) {
        setMessage("يرجى توضيح عنوان ومكان السكن بالتفصيل.");
        return false;
      }

      const transferClean = transferAccountNumber.trim().replace(/[-\s]/g, "");
      if (!phoneRegex.test(transferClean)) {
        setMessage("يرجى إدخال رقم الجوال الصحيح المرتبط بمحفظة أو حساب الاستلام (مثال: 0599000000).");
        return false;
      }

      if (sponsorshipStatus === "مكفول" && sponsorName.trim().length < 3) {
        setMessage("يرجى إدخال اسم الكفيل عند اختيار حالة مكفول.");
        return false;
      }

      if (sponsorshipStatus === "مكفول" && containsXss(sponsorName)) {
        setMessage("يحتوي اسم الكفيل على رموز غير آمنة.");
        return false;
      }

      if (sponsorshipStatus === "مكفول" && sponsorCountry.trim().length < 2) {
        setMessage("يرجى إدخال دولة الكفيل عند اختيار حالة مكفول.");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setDirection("next");
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setMessage("");
    setDirection("prev");
    setStep((prev) => prev - 1);
  };

  const handleSponsorshipStatusChange = (value: PublicSponsorshipStatus) => {
    setSponsorshipStatus(value);
    if (value === "غير مكفول") {
      setSponsorName("");
      setSponsorCountry("");
    }
  };

  const handleFileChange = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const isSizeOk = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isImage && !isPdf) {
        errors.push(`الملف "${file.name}" غير مدعوم. يُقبل فقط الصور وملفات PDF.`);
      } else if (!isSizeOk) {
        errors.push(`الملف "${file.name}" يتجاوز الحد الأقصى للحجم (5 ميغابايت).`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setMessage(errors.join(" \n"));
    }

    if (validFiles.length === 0) return;

    const updatedNewFiles = validFiles.map((file) => {
      const fileKey = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const decoratedFile = file as File & { uploadKey: string };
      decoratedFile.uploadKey = fileKey;
      return decoratedFile;
    });

    setFiles((prev) => [...prev, ...updatedNewFiles]);

    updatedNewFiles.forEach((file) => {
      const fileKey = file.uploadKey;
      setFileProgresses((prev) => ({ ...prev, [fileKey]: 0 }));

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
        }
        setFileProgresses((prev) => ({ ...prev, [fileKey]: currentProgress }));
      }, 150);

      intervalRefs.current.push(interval);
    });
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => {
      const removedFile = prev[indexToRemove];
      if (removedFile) {
        const url = URL.createObjectURL(removedFile);
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
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

    if (!validateStep(1) || !validateStep(2)) return;

    if (files.length === 0) {
      setMessage("يرجى رفع المستندات الثبوتية المطلوبة (مثل شهادة الميلاد أو شهادة الوفاة) للمتابعة.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createPublicApplication(
        {
          childFullName: sanitizeInput(childFullName),
          birthDate,
          sponsorName: sponsorshipStatus === "مكفول" ? sanitizeInput(sponsorName) : "",
          sponsorCountry: sponsorshipStatus === "مكفول" ? sanitizeInput(sponsorCountry) : "",
          sponsorshipAmount: null,
          sponsorPhone: "",
          guardianName: sanitizeInput(guardianName),
          guardianRelation: sanitizeInput(guardianRelation),
          guardianPhone,
          orphanType,
          address: sanitizeInput(address),
          transferAccountName,
          transferAccountNumber,
          documentsStatus: "مرفوعة بانتظار المراجعة",
          governorateCity,
          gender,
          sponsorshipStatus,
          currency: "شيكل",
          notes: sanitizeInput(notes),
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
    setTransferAccountName("بنك فلسطين");
    setTransferAccountNumber("");
    setSponsorshipStatus("غير مكفول");
    setSponsorName("");
    setSponsorCountry("");
    setNotes("");
    setFiles([]);
    setUploadProgress(0);
    setFileProgresses({});
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
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-base font-black text-slate-900 mb-4 border-b border-slate-100 pb-3">خطوات إرسال الطلب</h3>

              <div className="relative flex flex-col gap-6">
                <div className="absolute right-5 top-5 bottom-5 w-0.5 bg-slate-200/70 -z-10" />

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

                <div className="flex items-start gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl font-black text-sm transition-all duration-300 ${
                    step === 2 ? "bg-blue-600 text-white shadow-soft ring-4 ring-blue-100 scale-105" :
                    step > 2 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${step === 2 ? "text-blue-600" : "text-slate-800"}`}>الخطوة الثانية</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">بيانات الوصي والكفالة والتحويل</p>
                  </div>
                </div>

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
              <div className="mb-6 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2 text-xs font-black text-slate-500">
                  <span>نسبة اكتمال الطلب: {step === 1 ? "33%" : step === 2 ? "66%" : "100%"}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">الخطوة {step} من 3</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-blue-500 to-cyan-500 transition-all duration-500 ease-out shadow-inner animate-pulse"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {step === 1 && (
                <div className={`space-y-4 ${direction === "next" ? "slide-in-left" : "slide-in-right"}`}>
                  <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2 mb-2">بيانات اليتيم الأساسية</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">اسم الطفل كامل رباعي <span className="text-rose-500">*</span></label>
                      <input className="glass-input" value={childFullName} onChange={(e) => setChildFullName(e.target.value)} placeholder="مثال: أحمد محمد علي حسن" />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">تاريخ الميلاد <span className="text-rose-500">*</span></label>
                      <input
                        className="glass-input"
                        type="date"
                        value={birthDate}
                        min={oldestAllowedBirthDate}
                        max={todayInputValue}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                      <p className="mt-1 text-[10px] font-bold text-slate-400">يُقبل فقط الأطفال بعمر 15 سنة فأقل.</p>
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

              {step === 2 && (
                <div className={`space-y-5 ${direction === "next" ? "slide-in-left" : "slide-in-right"}`}>
                  <div>
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
                        <label className="mb-2 block text-xs font-black text-slate-700">رقم جوال الوصي للتواصل <span className="text-rose-500">*</span></label>
                        <input className="glass-input text-left" dir="ltr" type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="05xxxxxxxx" />
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

                  <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-4">
                    <h3 className="text-sm font-black text-slate-900 mb-3">بيانات حساب استقبال الكفالة</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-black text-slate-700">طريقة استقبال الكفالة <span className="text-rose-500">*</span></label>
                        <select className="glass-input" value={transferAccountName} onChange={(e) => setTransferAccountName(e.target.value as TransferAccountOption)}>
                          {transferAccountOptions.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-black text-slate-700">رقم الجوال المرتبط بالحساب <span className="text-rose-500">*</span></label>
                        <input className="glass-input text-left" dir="ltr" type="tel" value={transferAccountNumber} onChange={(e) => setTransferAccountNumber(e.target.value)} placeholder="05xxxxxxxx" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <h3 className="text-sm font-black text-slate-900 mb-3">بيانات حالة الكفالة</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-black text-slate-700">حالة الكفالة <span className="text-rose-500">*</span></label>
                        <select className="glass-input" value={sponsorshipStatus} onChange={(e) => handleSponsorshipStatusChange(e.target.value as PublicSponsorshipStatus)}>
                          <option>غير مكفول</option>
                          <option>مكفول</option>
                        </select>
                      </div>

                      {sponsorshipStatus === "مكفول" && (
                        <>
                          <div>
                            <label className="mb-2 block text-xs font-black text-slate-700">اسم الكفيل <span className="text-rose-500">*</span></label>
                            <input className="glass-input" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} placeholder="اسم الكفيل الحالي" />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black text-slate-700">دولة الكفيل <span className="text-rose-500">*</span></label>
                            <input className="glass-input" value={sponsorCountry} onChange={(e) => setSponsorCountry(e.target.value)} placeholder="دولة إقامة الكفيل" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700">ملاحظات إضافية</label>
                    <textarea
                      className="glass-input min-h-28 resize-y"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={1000}
                      placeholder="اكتب أي ملاحظات مهمة عن الحالة أو طريقة التواصل أو ظروف الأسرة"
                    />
                    <p className="mt-1 text-[10px] font-bold text-slate-400">اختياري — الحد الأقصى 1000 حرف.</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={`space-y-6 ${direction === "next" ? "slide-in-left" : "slide-in-right"}`}>
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
                      <div><span className="text-slate-400 font-bold block mb-0.5">حساب الاستلام:</span> {transferAccountName} — {transferAccountNumber}</div>
                      <div><span className="text-slate-400 font-bold block mb-0.5">حالة الكفالة:</span> {sponsorshipStatus}{sponsorshipStatus === "مكفول" && sponsorName ? ` — ${sponsorName}` : ""}{sponsorshipStatus === "مكفول" && sponsorCountry ? ` (${sponsorCountry})` : ""}</div>
                      <div className="md:col-span-2"><span className="text-slate-400 font-bold block mb-0.5">العنوان بالتفصيل:</span> {address}</div>
                      {notes.trim() && <div className="md:col-span-2"><span className="text-slate-400 font-bold block mb-0.5">الملاحظات:</span> {notes}</div>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <FileUp className="h-4 w-4 text-blue-500" />
                      إرفاق المستندات الثبوتية <span className="text-rose-500">*</span>
                    </h3>

                    <p className="text-xs text-slate-400 font-medium mb-3">
                      يرجى إرفاق شهادة ميلاد الطفل ووفاة الأب/الأبوين أو أي أوراق رسمية داعمة للطلب بصيغة صور أو PDF.
                    </p>

                    <div
                      className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                        isDragActive
                          ? "border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.02] shadow-[0_0_25px_rgba(59,130,246,0.2)]"
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

                    {files.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <h4 className="text-xs font-black text-slate-700">الملفات المرفقة ({files.length}):</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {files.map((file, idx) => {
                            const fileKey = (file as File & { uploadKey?: string }).uploadKey ?? `${file.name}-${idx}`;
                            const progress = fileProgresses[fileKey] ?? 0;
                            return (
                              <div key={fileKey} className="flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm animate-fade-in group space-y-3">
                                <div className="flex items-center gap-3 w-full">
                                  {file.type.startsWith("image/") ? (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt="معاينة الملف المرفق"
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
                                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                                    onClick={() => removeFile(idx)}
                                    title="إزالة الملف"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="w-full">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                                    <span>{progress === 100 ? "جاهز وآمن تماماً" : "جاري التهيئة والرفع الآمن..."}</span>
                                    <span className={progress === 100 ? "text-emerald-600 font-extrabold" : "text-blue-600"}>{progress}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden relative">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? "bg-emerald-500" : "bg-gradient-to-l from-blue-500 to-cyan-500"}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  <div />
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

      <QuranVersePopup />
    </section>
  );
}

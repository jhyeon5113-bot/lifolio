import { Header } from "@/components/Header";
import { auth } from "@/auth";
import { getReportData } from "@/lib/report-data";
import { ReportTabs } from "@/components/report/ReportTabs";

function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default async function ReportPage() {
  const session = await auth();
  const data = await getReportData(session?.user?.id);

  const dateRangeText = data.dateRange
    ? `${formatDate(data.dateRange.from)} - ${formatDate(data.dateRange.to)}`
    : "아직 기록된 결정이 없어요";

  return (
    <>
      <Header />
      <main className="pt-24 px-6 pb-12 max-w-container-max mx-auto">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-label-md text-secondary uppercase tracking-widest mb-2 block">
                Personal Analysis Report
              </span>
              <h2 className="text-headline-lg text-primary leading-tight">
                의사결정 인사이트 리포트
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                데이터로 들여다보는 당신의 삶의 방향성
              </p>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="material-symbols-outlined text-[20px]">
                calendar_today
              </span>
              <span className="text-label-md">{dateRangeText}</span>
            </div>
          </div>
        </section>

        <ReportTabs data={data} />
      </main>
    </>
  );
}

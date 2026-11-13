import {
  ArrowRight,
  Crosshair,
  Gauge,
  Headphones,
  MousePointer2,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

const modes = [
  {
    number: "01",
    icon: Target,
    tone: "cyan",
    title: "3D 에임 테스트",
    tag: "TRACK / REACT",
    description: "다가오는 홀로그램 과녁을 빠르게 포착하고 방어선에 도달하기 전에 처치하세요.",
    metric: "정확도 · 웨이브 · 콤보",
  },
  {
    number: "02",
    icon: Zap,
    tone: "pink",
    title: "초고속 연타 테스트",
    tag: "CLICK / BURST",
    description: "움직이는 에너지 코어를 정확히 클릭해 제한 시간 안에 최고 CPS를 기록하세요.",
    metric: "클릭 수 · CPS · 피크 기록",
  },
  {
    number: "03",
    icon: Crosshair,
    tone: "violet",
    title: "저격 은폐 타겟",
    tag: "SCOPE / HUNT",
    description: "우클릭 조준경으로 좁은 시야를 탐색하고, 은폐한 적을 한 발로 처리하세요.",
    metric: "처치 수 · 명중률 · 탐색",
  },
  {
    number: "04",
    icon: Gauge,
    tone: "amber",
    title: "반동제어 훈련",
    tag: "SPRAY / CONTROL",
    description: "랜덤하게 튀는 자동 연사 반동을 반대 방향으로 보정해 탄착군을 중앙에 유지하세요.",
    metric: "제어율 · 발사 수 · 분산",
  },
];

const toneMap = {
  cyan: {
    text: "text-cyan-300",
    border: "border-cyan-400/25 hover:border-cyan-300/70",
    glow: "shadow-[0_0_32px_rgba(34,211,238,0.12)]",
    bg: "bg-cyan-400/10",
  },
  pink: {
    text: "text-pink-300",
    border: "border-pink-400/25 hover:border-pink-300/70",
    glow: "shadow-[0_0_32px_rgba(244,114,182,0.12)]",
    bg: "bg-pink-400/10",
  },
  violet: {
    text: "text-violet-300",
    border: "border-violet-400/25 hover:border-violet-300/70",
    glow: "shadow-[0_0_32px_rgba(167,139,250,0.12)]",
    bg: "bg-violet-400/10",
  },
  amber: {
    text: "text-amber-300",
    border: "border-amber-400/25 hover:border-amber-300/70",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
    bg: "bg-amber-400/10",
  },
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[10px] font-mono font-bold tracking-[0.28em] text-cyan-300/75">
      <span className="h-px w-8 bg-cyan-300/60" />
      {children}
    </div>
  );
}

export default function IntroPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050817] text-white selection:bg-cyan-300 selection:text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[#050817]" />
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/manus-storage/arena_bg_35240ab8.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(0,238,255,0.15),transparent_33%),linear-gradient(180deg,rgba(4,8,24,0.34),#050817_78%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(0,240,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.28)_1px,transparent_1px)] [background-size:72px_72px]" />

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#050817]/75 px-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <a href="/intro" className="flex items-center gap-3" aria-label="NEON Aim Trainer 소개 홈">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.22)]">
              <Crosshair className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.12em] text-white">NEON // AIM TRAINER</span>
              <span className="hidden text-[9px] font-mono tracking-[0.24em] text-cyan-300/60 sm:block">CYBERNETIC REFLEX SIMULATION</span>
            </span>
          </a>
          <div className="hidden items-center gap-7 text-xs font-semibold text-slate-300 md:flex">
            <a className="transition-colors hover:text-cyan-300" href="#modes">훈련 모드</a>
            <a className="transition-colors hover:text-cyan-300" href="#flow">플레이 방법</a>
            <a className="transition-colors hover:text-cyan-300" href="#spec">게임 특징</a>
          </div>
          <a href="/" className="group inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100 transition-all hover:bg-cyan-300/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]">
            게임 실행 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-mono font-bold tracking-[0.22em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" /> REFLEX / PRECISION / CONTROL
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.7rem]">
            반응을 깨우고,
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300 bg-clip-text text-transparent">기록을 갱신하라.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-300/85 sm:text-lg">
            NEON // AIM TRAINER는 설치 없이 바로 실행하는 브라우저 기반 사격 훈련장입니다. 에임, 연타, 저격, 반동제어를 짧고 강렬한 세션으로 반복하며 나만의 한계를 넘어보세요.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/" className="group inline-flex items-center gap-3 rounded-xl bg-cyan-300 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all hover:-translate-y-0.5 hover:bg-cyan-200">
              지금 훈련 시작 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#modes" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:border-cyan-300/50 hover:bg-white/10">
              4가지 모드 살펴보기
            </a>
          </div>
          <div className="mt-11 flex flex-wrap gap-x-8 gap-y-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2"><MousePointer2 className="h-4 w-4 text-cyan-300" /> PC 마우스 플레이</span>
            <span className="flex items-center gap-2"><Timer className="h-4 w-4 text-pink-300" /> 3초 준비 카운트다운</span>
            <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> 로컬 기록 저장</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -inset-10 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/65 p-3 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="relative aspect-[0.92] overflow-hidden rounded-[1.5rem] border border-cyan-300/20 bg-[#07152b]">
              <img src="/manus-storage/arena_bg_35240ab8.png" alt="네온 사이버 사격장" className="absolute inset-0 h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061023] via-transparent to-[#07152b]/20" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-cyan-200/80">
                <span>LIVE TRAINING FEED</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> ONLINE</span>
              </div>
              <div className="absolute left-5 top-14 rounded-xl border border-cyan-300/25 bg-slate-950/60 p-3 backdrop-blur-md">
                <div className="text-[9px] font-mono tracking-widest text-cyan-300/70">ACCURACY</div>
                <div className="mt-1 text-3xl font-black text-cyan-100">98.4<span className="text-sm text-cyan-300">%</span></div>
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <div className="mb-3 text-[10px] font-mono tracking-[0.3em] text-cyan-200/80">TARGET LOCKED</div>
                <div className="relative grid h-36 w-36 place-items-center rounded-full border border-cyan-200/70 shadow-[0_0_22px_rgba(34,211,238,0.75),inset_0_0_24px_rgba(34,211,238,0.25)]">
                  <div className="absolute inset-4 rounded-full border border-pink-300/80" />
                  <div className="absolute inset-10 rounded-full border border-cyan-100/90" />
                  <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_15px_#fff,0_0_30px_#22d3ee]" />
                  <span className="absolute -top-4 left-1/2 h-5 w-px -translate-x-1/2 bg-cyan-200" />
                  <span className="absolute -bottom-4 left-1/2 h-5 w-px -translate-x-1/2 bg-cyan-200" />
                  <span className="absolute -left-4 top-1/2 h-px w-5 -translate-y-1/2 bg-cyan-200" />
                  <span className="absolute -right-4 top-1/2 h-px w-5 -translate-y-1/2 bg-cyan-200" />
                </div>
              </div>
              <img src="/manus-storage/target_orb_sharp_8fcd78d3.png" alt="홀로그램 과녁" className="absolute right-[14%] top-[32%] h-16 w-16 animate-pulse drop-shadow-[0_0_18px_rgba(34,211,238,0.95)]" />
              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2 text-[9px] font-mono text-slate-300 backdrop-blur-md"><span>WAVE 04</span><span className="text-cyan-300">READY TO IMPROVE</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="spec" className="border-y border-white/10 bg-slate-950/45 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionLabel>WHY NEON AIM TRAINER</SectionLabel>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">게임처럼 몰입하고,<br /><span className="text-cyan-300">훈련처럼 성장합니다.</span></h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "짧은 세션", "바쁜 순간에도 10~40초 집중 훈련"],
                ["02", "즉각 피드백", "점수·정확도·콤보를 한눈에 확인"],
                ["03", "반복 가능한 기록", "로컬 최고 기록으로 성장 체감"],
              ].map(([n, title, text]) => (
                <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/30 hover:bg-white/[0.06]">
                  <div className="text-xs font-mono text-cyan-300">{n}</div><div className="mt-4 font-bold text-white">{title}</div><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modes" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <SectionLabel>FOUR TRAINING PROTOCOLS</SectionLabel>
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h2 className="max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">당신의 약점을<br /><span className="text-slate-400">정확히 조준하세요.</span></h2>
          <p className="max-w-sm text-sm leading-6 text-slate-400">모드마다 다른 능력을 요구합니다. 하나의 점수보다, 네 가지 지표가 함께 좋아지는 과정을 경험하세요.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {modes.map((mode) => {
            const Icon = mode.icon; const tone = toneMap[mode.tone as keyof typeof toneMap];
            return <article key={mode.number} className={`group relative overflow-hidden rounded-3xl border bg-white/[0.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] ${tone.border} ${tone.glow}`}>
              <div className="absolute right-5 top-4 text-6xl font-black text-white/[0.035]">{mode.number}</div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border border-white/10 ${tone.bg} ${tone.text}`}><Icon className="h-6 w-6" /></div>
              <div className={`mt-7 text-[10px] font-mono font-bold tracking-[0.23em] ${tone.text}`}>{mode.tag}</div>
              <h3 className="mt-2 text-xl font-black text-white">{mode.title}</h3>
              <p className="mt-3 min-h-[50px] text-sm leading-6 text-slate-400">{mode.description}</p>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-mono tracking-wider text-slate-400"><span>TRAINING METRICS</span><span className={tone.text}>{mode.metric}</span></div>
            </article>;
          })}
        </div>
      </section>

      <section id="flow" className="border-y border-white/10 bg-[#071125]/80 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <SectionLabel>HOW TO PLAY</SectionLabel>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">3초 후,<br /><span className="text-pink-300">집중이 시작됩니다.</span></h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">모드를 고르고 난이도를 선택하면 준비 카운트다운이 시작됩니다. 카운트다운 중에는 점수와 시간이 멈춰 있어, 오직 실력으로 시작할 수 있습니다.</p>
              <a href="/" className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">브라우저에서 직접 플레이 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "모드 선택", "에임·연타·저격·반동제어 중 오늘의 훈련을 선택"],
                ["02", "난이도 설정", "쉬움·보통·어려움으로 목표 강도를 조절"],
                ["03", "기록 갱신", "결과 화면에서 나의 정확도와 최고 기록 확인"],
              ].map(([n, title, text], i) => <div key={n} className="relative rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                {i < 2 && <span className="absolute -right-3 top-1/2 z-10 hidden h-px w-6 bg-cyan-300/50 sm:block" />}
                <div className="flex items-center justify-between"><span className="text-xs font-mono text-cyan-300">{n}</span><ArrowRight className="h-4 w-4 text-slate-600" /></div>
                <h3 className="mt-8 font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
              </div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-gradient-to-br from-cyan-300/15 via-slate-950/75 to-fuchsia-400/10 px-6 py-14 text-center shadow-[0_0_70px_rgba(34,211,238,0.1)] sm:px-12">
          <div className="absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
          <Shield className="relative mx-auto h-8 w-8 text-cyan-300" />
          <h2 className="relative mt-5 text-3xl font-black text-white sm:text-5xl">다음 한 발은<br /><span className="text-cyan-300">더 정확하게.</span></h2>
          <p className="relative mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-300">설치도, 회원가입도 필요 없습니다. 브라우저를 열고 오늘의 훈련을 바로 시작하세요.</p>
          <a href="/" className="relative mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100">훈련장 입장하기 <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span className="font-mono tracking-widest">NEON // AIM TRAINER</span><span>Cybernetic Reflex & Click Simulation · Browser Game</span></div>
      </footer>
    </main>
  );
}

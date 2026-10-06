/**
 * First-visit intro: the AR monogram settles in, the wordmark rises beneath it,
 * then the veil lifts. Pure CSS (see `.intro-veil` in globals.css), so it always
 * removes itself — even if JavaScript is slow or fails. A tiny inline script
 * skips it for the rest of the session; reduced-motion users never see it.
 * Page content renders underneath, so LCP is unaffected.
 */
const SKIP_SCRIPT = `try{var s=sessionStorage;if(s.getItem("aar-intro"))document.documentElement.classList.add("intro-seen");else s.setItem("aar-intro","1")}catch(e){document.documentElement.classList.add("intro-seen")}`;

export function Preloader(_props: { locale?: string }) {
  return (
    <>
      {/* Runs while the HTML is parsed, before the veil paints */}
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div className="intro-veil" aria-hidden>
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img so it paints with the first HTML */}
          <img src="/brand/mark-on-dark-sm.png" alt="" width={276} height={240} className="intro-mark h-28 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/word-on-dark-sm.png" alt="" width={300} height={52} className="intro-word mt-5 h-6 w-auto" />
        </div>
      </div>
    </>
  );
}

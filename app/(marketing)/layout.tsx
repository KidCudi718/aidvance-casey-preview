import Link from "next/link";
import SiteHeader from "../SiteHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-page">
      <SiteHeader />
      <div className="m-main">{children}</div>
      <footer className="m-foot">
        <p className="m-foot-heart">Is AI right for your business?</p>
        <Link className="m-textlink" href="/#casey">
          Talk to Casey
        </Link>
      </footer>
    </div>
  );
}

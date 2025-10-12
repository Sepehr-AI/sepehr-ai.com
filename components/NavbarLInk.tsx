import Link from "next/link";
import type { MouseEventHandler, PropsWithChildren } from "react";

export interface NavbarLinkProps extends PropsWithChildren {
  href: string;
  border?: boolean;
  prefetch?: boolean;
  onLinkClick?: MouseEventHandler<HTMLDivElement>;
}

export default function NavbarLink({
  href,
  children,
  onLinkClick,
  border = false,
  prefetch = false,
}: NavbarLinkProps) {
  return (
    <div onClick={onLinkClick}>
      <Link
        href={href}
        shallow={true}
        prefetch={prefetch}
        className={`
          flex py-3 px-4 items-center gap-3 rounded-lg 
          hover:bg-gray-50 transition-colors duration-200 
          text-gray-700 cursor-pointer text-sm mb-2
          ${border ? "border border-gray-100 hover:border-emerald-200" : ""}
        `}
      >
        {children}
      </Link>
    </div>
  );
}

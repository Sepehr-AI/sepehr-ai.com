import Link from "next/link";
import { PropsWithChildren, MouseEventHandler } from "react";

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
        className={
          "flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1" +
          (border ? " border border-white/20" : "")
        }
      >
        {children}
      </Link>
    </div>
  );
}

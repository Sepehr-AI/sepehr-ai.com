"use client";

import {
  HamburgerMenuIcon,
  LightningBoltIcon,
  MixerHorizontalIcon,
  MoonIcon,
  PersonIcon,
  QuestionMarkCircledIcon,
  RocketIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Switch from "@radix-ui/react-switch";
import Link from "next/link";
import { useState } from "react";

import { useTheme } from "../ThemeProvider";
import Icon from "./Icon";

export default function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-md bg-background/80">
      <div className="mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex-1 flex">
          <Icon
            fill={theme === "dark" ? "#fff" : "#000"}
            className="h-13 w-auto"
          />
        </Link>

        <div className="lg:hidden">
          <button
            className="rounded-full p-2 hover:bg-accent/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <HamburgerMenuIcon width={20} height={20} />
          </button>
        </div>

        <NavigationMenu.Root className="hidden lg:flex lg:flex-none">
          <NavigationMenu.List className="flex items-center gap-6">
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <a
                  href="#models"
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
                >
                  <LightningBoltIcon />
                  <span>مدل‌ها</span>
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <a
                  href="#features"
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
                >
                  <RocketIcon />
                  <span>ویژگی‌ها</span>
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <a
                  href="#pricing"
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
                >
                  <MixerHorizontalIcon />
                  <span>قیمت‌گذاری</span>
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <a
                  href="#faq"
                  className="flex items-center gap-1 text-sm font-medium hover:text-accent transition-colors"
                >
                  <QuestionMarkCircledIcon />
                  <span>سوالات متداول</span>
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="ltr flex-1 flex items-center gap-3">
          <Link
            href="/auth"
            className="hidden md:flex items-center gap-1 bg-accent text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <PersonIcon />
            <span>ورود / ثبت‌نام</span>
          </Link>

          <div className="flex items-center space-x-2">
            <SunIcon className="ml-2" />
            <Switch.Root
              id="theme-switch"
              className="w-11 h-6 bg-gray-400 rounded-full relative data-[state=checked]:bg-accent outline-none cursor-pointer"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-6" />
            </Switch.Root>
            <label htmlFor="theme-switch" className="sr-only">
              تغییر حالت تاریک/روشن
            </label>
            <MoonIcon className="ml-2" />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background border-t border-border py-4 px-6">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              className="flex items-center gap-2 py-2 hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <RocketIcon />
              <span>ویژگی‌ها</span>
            </a>
            <a
              href="#models"
              className="flex items-center gap-2 py-2 hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <LightningBoltIcon />
              <span>مدل‌ها</span>
            </a>
            <a
              href="#pricing"
              className="flex items-center gap-2 py-2 hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <MixerHorizontalIcon />
              <span>قیمت‌گذاری</span>
            </a>
            <a
              href="#faq"
              className="flex items-center gap-2 py-2 hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <QuestionMarkCircledIcon />
              <span>سوالات متداول</span>
            </a>
            <Link
              href="/auth"
              className="flex items-center gap-2 py-2 hover:text-accent transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <PersonIcon />
              <span>ورود / ثبت‌نام</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { IoClose } from "react-icons/io5";

export default function MobileSiderbar({
  isComponentVisible,
  setIsComponentVisible,
}: {
  isComponentVisible: boolean;
  setIsComponentVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div id="headlessui-portal-root">
      <div data-headlessui-portal="">
        <button
          type="button"
          aria-hidden="true"
          className="fixed top-[1px] left-[1px] w-[1px] h-0 p-0 m-[-1px] whitespace-nowrap border-0"
        ></button>
        <div>
          <div
            className="relative z-40"
            id="headlessui-dialog-:re:"
            role="dialog"
            aria-modal="true"
            data-headlessui-state="open"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 opacity-100"></div>
            <div className="fixed inset-0 z-40 flex">
              <div
                className="w-full max-w-xs bg-gray-900 translate-x-0"
                id="headlessui-dialog-panel-:rf:"
                data-headlessui-state="open"
              >
                <div className="flex my-2 mx-2">
                  <div className="w-full"></div>
                  <IoClose
                    size="1.75em"
                    className="text-white"
                    onClick={() => setIsComponentVisible(false)}
                  />
                </div>
                <Sidebar setIsComponentVisible={setIsComponentVisible} />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-hidden="true"
          className="fixed top-[1px] left-[1px] w-[1px] h-0 p-0 m-[-1px] whitespace-nowrap border-0"
        ></button>
      </div>
    </div>
  );
}

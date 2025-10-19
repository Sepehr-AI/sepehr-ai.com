import type { IconBaseProps } from "react-icons";

export default function Pixverse(props: IconBaseProps) {
  return (
    <svg
      {...props}
      width="1.25em"
      height="1.25em"
      strokeWidth="0"
      fill="currentColor"
      stroke="currentColor"
      viewBox="0 0 295 512"
    >
      <defs>
        <linearGradient
          id="iconifyReact199"
          x1="-154.021"
          x2="184.641"
          y1="141.162"
          y2="465.119"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FE9E58"></stop>
          <stop offset=".396" stopColor="#E470EC"></stop>
          <stop offset="1" stopColor="#442FBA"></stop>
        </linearGradient>
        <linearGradient
          id="iconifyReact200"
          x1="233.374"
          x2="-105.287"
          y1="138.773"
          y2="462.73"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFA052"></stop>
          <stop offset=".396" stopColor="#E36CFA" stopOpacity=".8"></stop>
          <stop offset="1" stopColor="#442FBA" stopOpacity=".7"></stop>
        </linearGradient>
      </defs>

      <path
        fill="url(#iconifyReact199)"
        d="m145.82 466.117-106.469-50.1V141.86c0-13.017 5.696-27.465 14.901-36.67l24.619-24.617 107.623 350.191c7.569 24.452-17.512 46.252-40.674 35.353"
      ></path>
      <path
        fill="url(#iconifyReact200)"
        d="M294.231 192.636 172.796 59.066c-18.852-20.736-51.21-21.506-71.027-1.69L54.253 105.19c-9.07 10.365-14.252 21.262-14.252 34.28v274.157l243.164-145.89c26.56-15.935 31.901-52.185 11.066-75.102"
      ></path>
    </svg>
  );
}

import type { IconBaseProps, IconType } from "react-icons";

export default function WithColor(Comp: IconType, color: string) {
  return Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ color: _, ...props }: IconBaseProps) => (
      <Comp color={color} {...props} />
    ),
    { displayName: "WithColorAnonymousComponent" },
  );
}

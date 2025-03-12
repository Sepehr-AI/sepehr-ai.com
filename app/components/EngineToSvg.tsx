import { FaRobot } from "react-icons/fa6";
import { SiOpenai } from "react-icons/si";

export default function EngineToSvg({
  engine,
  ...props
}: {
  engine: string;
  size?: string;
  color?: string;
  className?: string;
}) {
  if (engine.startsWith("openai")) {
    return <SiOpenai {...props} />;
  }

  return <FaRobot {...props} />;
}

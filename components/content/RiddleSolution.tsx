import { RIDDLES, type RiddleKey } from "@/lib/riddles";
import Expand from "./Expand";

interface RiddleSolutionProps {
  riddle: RiddleKey;
  children: React.ReactNode;
  id?: string;
}

export default function RiddleSolution({ riddle, children, id }: RiddleSolutionProps) {
  const riddleConfig = RIDDLES[riddle];
  const headline = `${riddleConfig.emoji} ${riddleConfig.name}`;
  
  return (
    <Expand headline={headline} id={id}>
      {children}
    </Expand>
  );
}
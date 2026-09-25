import type React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Skiper87Props = React.ComponentProps<typeof ScrollArea>;

const Skiper87 = ({ className, children, ...props }: Skiper87Props) => (
  <ScrollArea className={className} {...props}>
    {children}
  </ScrollArea>
);

export { Skiper87 };

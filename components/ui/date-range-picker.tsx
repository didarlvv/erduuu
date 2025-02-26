"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: Date;
  onChange?: (date: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({
  className,
  date,
  onChange,
  ...props
}: DateRangePickerProps) {
  const [localDate, setLocalDate] = React.useState<{ from?: Date; to?: Date }>(
    date ? { from: date, to: date } : undefined
  );

  React.useEffect(() => {
    if (date) {
      setLocalDate({ from: date, to: date });
    }
  }, [date]);

  const handleSelect = (date: Date | undefined) => {
    setLocalDate({ from: date, to: date });
    onChange?.({ from: date, to: date });
  };

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !localDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {localDate?.from ? (
              format(localDate.from, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={localDate?.from}
            onSelect={handleSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

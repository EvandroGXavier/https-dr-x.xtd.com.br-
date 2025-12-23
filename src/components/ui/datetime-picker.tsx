import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ value, onChange, placeholder = "Selecione data e hora", disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [time, setTime] = React.useState(
      value ? format(value, "HH:mm") : "09:00"
    );

    const handleDateSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(selectedDate);
        newDate.setHours(hours, minutes, 0, 0);
        onChange(newDate);
      } else {
        onChange(undefined);
      }
    };

    const handleTimeChange = (newTime: string) => {
      setTime(newTime);
      if (value) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(value);
        newDate.setHours(hours, minutes, 0, 0);
        onChange(newDate);
      }
    };

    const formatDateTime = (date: Date | undefined) => {
      if (!date) return placeholder;
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    React.useEffect(() => {
      if (value) {
        setTime(format(value, "HH:mm"));
      }
    }, [value]);

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateTime(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={() => setOpen(false)}
                className="w-full"
                size="sm"
              >
                Confirmar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";
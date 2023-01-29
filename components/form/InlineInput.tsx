import clsx from 'clsx';
import { useRef } from 'react';

export const InlineInput: React.FC<{
  className?: string;
  value: string;
  disabled?: boolean;
  onUpdate: (next: string) => void;
}> = ({ className, disabled, value, onUpdate }) => {
  const prevVal = useRef(value);
  return (
    <input
      type="text"
      className={clsx(
        className,
        'bg-transparent border border-transparent -mx-2 px-2',
        disabled
          ? 'cursor-text'
          : 'hover:border-blue-500 focus:border-blue-500',
      )}
      defaultValue={value}
      disabled={disabled}
      onBlur={(e) => {
        if (prevVal.current !== e.target.value) {
          onUpdate(e.target.value);
          prevVal.current = e.target.value;
        }
      }}
    />
  );
};

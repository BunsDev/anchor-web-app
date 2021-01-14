import { KeyboardEvent, useCallback, useMemo } from 'react';

export interface RestrictedInputReturn {
  onKeyPress: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export default function useRestrictedInput(
  availableCharacters: ((character: string) => boolean) | string,
): RestrictedInputReturn {
  const test: (character: string) => boolean = useMemo(() => {
    if (typeof availableCharacters === 'string') {
      const pattern: RegExp = new RegExp(`[${availableCharacters}]`);
      return (character: string) => pattern.test(character);
    } else if (typeof availableCharacters === 'function') {
      return availableCharacters;
    }
    throw new Error('availableCharacters must be string or function');
  }, [availableCharacters]);

  const onKeyPress: (
    event: KeyboardEvent<HTMLInputElement>,
  ) => void = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!test(event.key)) {
        // prevent key press
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [test],
  );

  return {
    onKeyPress,
  };
}

export interface RestrictedNumberInputParams {
  type?: 'decimal' | 'integer';
  maxDecimalPoints?: number;
}

export function useRestrictedNumberInput({
  type = 'decimal',
  maxDecimalPoints,
}: RestrictedNumberInputParams): RestrictedInputReturn {
  const { onKeyPress: restrictCharacters } = useRestrictedInput(
    type === 'integer' ? '0-9' : '0-9.',
  );

  const onKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      restrictCharacters(event);

      if (event.isDefaultPrevented()) {
        return;
      }

      //@ts-ignore
      const value = event.target.value + event.key;

      if (
        Number.isNaN(+value) ||
        (type === 'decimal' &&
          typeof maxDecimalPoints === 'number' &&
          new RegExp(`.[0-9]{${maxDecimalPoints + 1},}$`).test(value))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [maxDecimalPoints, restrictCharacters, type],
  );

  return { onKeyPress };
}

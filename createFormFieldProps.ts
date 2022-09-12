/* Helper function that returns a set of properties that can be used
in the component that show the form field with name `fieldName`.

For example:

        const addressInputProps = createFormFieldProps({
          formState: formState,
          fieldName: 'address',
        });
        const addressInput = <input {...addressInputProps}/>

will have the effect that:

- the `name` property of the <input> element will be 'address'
- the `defaultValue` property of the <input> element will be
`formState.getValue('address')`
- the `onChange` property of the <input> element will be connected to
`formState.setValue('address', <new value>)`

*/

import React from 'react';
import { FormState } from './FormStateProvider';

export type FieldTypeT = 'checkbox' | 'text' | 'password';

interface IProps {
  formState: FormState;
  fieldName: string;
  fieldType: FieldTypeT;
  controlled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

export const createFormFieldProps = (props: IProps) => {
  const valueKey = !!props.controlled ? 'value' : 'defaultValue';
  const value = props.formState.getValue(props.fieldName);

  return {
    ...(props.fieldType === 'checkbox'
      ? {
          checked: props.formState.getValue(props.fieldName),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            props.formState.setValue(
              props.fieldName,
              !props.formState.getValue(props.fieldName)
            );
            if (props.onChange !== undefined) {
              props.onChange(e);
            }
          },
        }
      : {
          [valueKey]: value === null ? undefined : value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            props.formState.setValue(props.fieldName, e.target.value);
            if (props.onChange !== undefined) {
              props.onChange(e);
            }
          },
        }),
    type: props.fieldType,
    name: props.fieldName,
    readOnly: props.readOnly,
  };
};

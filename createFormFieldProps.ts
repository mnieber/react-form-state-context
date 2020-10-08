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

import React from "react";
import { IFormState } from "./FormStateProvider";

type FieldTypeT = "checkbox" | "text" | "password";

interface IProps {
  formState: IFormState;
  fieldName: string;
  fieldType: FieldTypeT;
}

export const createFormFieldProps = ({
  formState,
  fieldName,
  fieldType,
}: IProps) => {
  return {
    ...(fieldType === "checkbox"
      ? {
          checked: formState.getValue(fieldName),
        }
      : {
          defaultValue: formState.getValue(fieldName),
        }),
    name: fieldName,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      formState.setValue(fieldName, e.target.value);
    },
  };
};

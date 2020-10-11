import React from "react";

export interface IFormState {
  values: { [fieldName: string]: any };
  errors: { [fieldName: string]: string };
  validate: () => void;
  submit: () => void;
  getValue: (fieldName: string) => any;
  setValue: (fieldName: string, value: any) => void;
  setError: (fieldName: string, error: string) => void;
  getError: (fieldName: string) => string;
  reset: (
    newInitialValues: IFormState["values"],
    newInitialErrors: IFormState["errors"]
  ) => void;
}

export interface HandleValidateArgsT {
  values: IFormState["values"];
  getValue: IFormState["getValue"];
  setError: IFormState["setError"];
}

export type HandleValidateT = ({
  values,
  getValue,
  setError,
}: HandleValidateArgsT) => void;

export interface HandleSubmitArgsT {
  values: IFormState["values"];
}

export type HandleSubmitT = ({ values }: HandleSubmitArgsT) => void;

const useFormState = (
  initialValues: IFormState["values"],
  initialErrors: IFormState["errors"],
  handleValidate: HandleValidateT | undefined,
  handleSubmit: HandleSubmitT
): IFormState => {
  const [values, setValues] = React.useState({ ...initialValues });
  const [errors, setErrors] = React.useState<IFormState["errors"]>({
    ...initialErrors,
  });

  const _checkKey = (key: string) => {
    if (initialValues[key] === undefined) {
      console.error(`Unknown form field ${key}`);
    }
  };

  const setValue = (key: string, value: any) => {
    _checkKey(key);
    setValues({
      ...values,
      [key]: value,
    });
  };

  const getValue = (key: string) => {
    _checkKey(key);
    return values[key];
  };

  const setError = (key: string, error: string) => {
    setErrors({
      ...errors,
      [key]: error,
    });
  };

  const reset = (
    newInitialValues: IFormState["values"],
    newInitialErrors: IFormState["errors"]
  ) => {
    setValues(newInitialValues);
    setErrors(newInitialErrors);
  };

  const getError = (key: string) => {
    return errors[key];
  };

  const validate = () => {
    const errors = {} as IFormState["errors"];
    if (handleValidate) {
      handleValidate({
        values,
        getValue,
        setError: (fieldName, error) => {
          _checkKey(fieldName);
          errors[fieldName] = error;
        },
      });
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = () => {
    if (validate()) {
      if (!!handleSubmit) handleSubmit({ values });
    }
  };

  return {
    values,
    errors,
    validate,
    submit,
    getValue,
    setValue,
    setError,
    getError,
    reset,
  };
};

const getNullFormState = (): IFormState => {
  return {
    values: {},
    errors: {},
    validate: () => {},
    submit: () => {},
    getValue: (fieldName: string) => undefined,
    setValue: (fieldName: string, value: any) => {},
    setError: (fieldName: string, value: string) => {},
    getError: (fieldName: string) => "",
    reset: (
      initialValues: IFormState["values"],
      initialErrors: IFormState["errors"]
    ) => {},
  };
};

export const FormStateContext = React.createContext(getNullFormState());

const useDetectChange = (x: string) => {
  const [memo, setMemo] = React.useState(x);
  const changed = x !== memo;
  if (changed) {
    setMemo(x);
  }
  return changed;
};

type PropsT = React.PropsWithChildren<{
  initialValues: IFormState["values"];
  initialErrors?: IFormState["errors"];
  handleValidate?: HandleValidateT;
  handleSubmit: HandleSubmitT;
}>;

export const FormStateProvider: React.FC<PropsT> = ({
  initialValues,
  initialErrors,
  handleValidate,
  handleSubmit,
  children,
}: PropsT) => {
  const getInitialErrors = () => initialErrors ?? {};

  const formState = useFormState(
    initialValues,
    getInitialErrors(),
    handleValidate,
    handleSubmit
  );

  const hash =
    JSON.stringify(initialValues) + JSON.stringify(getInitialErrors());
  if (useDetectChange(hash)) {
    formState.reset(initialValues, getInitialErrors());
  }

  return (
    <FormStateContext.Provider value={formState}>
      {children}
    </FormStateContext.Provider>
  );
};

export const useFormStateContext = () => {
  return React.useContext(FormStateContext);
};

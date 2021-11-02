import React from 'react';

import {FieldArrayContext} from '~/@common/field-array-context';
import {FormContext} from '~/@common/form-context';
import {useRegisterField} from '~/@common/hooks/use-register-field';
import {
	FieldArrayState,
	FieldMeta,
	FormContextState,
	ValidateFuncType,
} from '~/@common/types';

import ValidatedField, {
	InternalFieldProps,
	ValidatedFieldProps,
} from './validated-field';

type NamedFieldProps<T> = Omit<ValidatedFieldProps<T>, 'field' | 'name'> & {
	fieldArrayState: FieldArrayState;
	formState: FormContextState;
	providedName: string;
};

const NamedField = <T,>({
	fieldArrayState,
	formState,
	providedName,
	...rest
}: NamedFieldProps<T>) => {
	const {field, isInsideForm, name} = useRegisterField(
		fieldArrayState,
		formState,
		providedName,
	);

	if (isInsideForm && !field) {
		return null;
	}

	return <ValidatedField {...rest} field={field} name={name} />;
};

export type FieldProps = {
	name: string;
	validators?: Array<ValidateFuncType>;
};

/**
 * createField принимает пользовательский компонент и возвращает {name, validators, ...props}
 *
 * @see https://@altiore/form'.github.io/...
 * @category Components
 *
 * @typedef createField
 * @prop {React.ReactNode} [component] [React.ReactNode] Компонент
 *
 * @example
 * import {FieldProps, createField} from '@altiore/form';
 *
 * interface IField extends FieldProps {
 *  label: string;
 * }
 * const Field = createField<IField>(({errors, label, name}) => {
 *   return (
 *     <div>
 *       <span>{label}</span>
 *       <span>{name}</span>
 *       <input name={name} />
 *       <span>{errors[0]}</span>
 *     </div>
 *   );
 * });
 */
export const createField = <T extends FieldProps>(
	component: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element,
): ((props: T) => JSX.Element) => {
	return React.memo(({name, validators, ...props}): JSX.Element => {
		return (
			<FormContext.Consumer>
				{(formState) => (
					<FieldArrayContext.Consumer>
						{(fieldArrayState) => {
							return (
								<NamedField<Omit<T, 'name' | 'validators'>>
									fieldArrayState={fieldArrayState}
									formState={formState}
									component={component}
									componentProps={props}
									providedName={name}
									validators={validators}
								/>
							);
						}}
					</FieldArrayContext.Consumer>
				)}
			</FormContext.Consumer>
		);
	});
};

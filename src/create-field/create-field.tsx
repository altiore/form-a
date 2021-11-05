import React from 'react';

import {FieldArrayContext} from '~/@common/field-array-context';
import {FormContext} from '~/@common/form-context';
import {FieldMeta, FieldType, ValidateFuncType} from '~/@common/types';

import NamedField, {InternalFieldProps} from './named-field';

export type FieldProps = {
	name: string;
	defaultValue?: any;
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

export function createField<T extends FieldProps>(
	fieldType: FieldType,
	component: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element,
): <Values extends Record<string, any> = Record<string, any>>(
	props: T & {name: keyof Values},
) => JSX.Element;

export function createField<T extends FieldProps>(
	component: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element,
): <Values extends Record<string, any> = Record<string, any>>(
	props: T & {name: keyof Values},
) => JSX.Element;

export function createField<T extends FieldProps>(
	fieldTypeOrComponent:
		| FieldType
		| ((
				props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
		  ) => JSX.Element),
	componentInSecondParam?: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element,
): <Values extends Record<string, any> = Record<string, any>>(
	props: T & {name: keyof Values},
) => JSX.Element {
	const fieldType = componentInSecondParam
		? (fieldTypeOrComponent as FieldType)
		: undefined;
	const component: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element =
		componentInSecondParam ??
		(fieldTypeOrComponent as (
			props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
		) => JSX.Element);

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
									type={fieldType}
									validators={validators}
								/>
							);
						}}
					</FieldArrayContext.Consumer>
				)}
			</FormContext.Consumer>
		);
	});
}

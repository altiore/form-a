import React, {FormEvent, useCallback, useRef, useState} from 'react';

import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import set from 'lodash/set';
import unset from 'lodash/unset';

import {FormContext} from '~/@common/form-context';
import {FieldType, FormContextState, ValidateFunc} from '~/@common/types';
import {getNodeByName, getValueByTypeAndTarget} from '~/@common/utils';

import {toFlatErrors} from './form.utils';
import {FormProps} from './types';

const parseBoolean = (value: string | undefined): any => value === 'on';
const parseNumber = (value: string): any => parseInt(value, 10);
const parseDefault = (value: string): any => (value === '' ? null : value);
const toArray = (value: any): string[] => {
	if (typeof value === 'string') {
		return [value];
	}

	if (Array.isArray(value)) {
		return value;
	}

	return [];
};

const getValueByType = new Map([
	[FieldType.BOOLEAN, parseBoolean],
	[FieldType.NUMBER, parseNumber],
	[FieldType.SELECT_MULTIPLE, toArray],
]);

const getItemsFromDefVal = (_: any, i: number) => i;

/**
 * Форма - элемент взаимодействия пользователя с сайтом или приложением
 *
 * Простейший вариант формы выглядит следующим образом: мы используем элементы <input name="name"/>
 * и <button type="submit">Submit</button>, предварительно импортировав ее из библиотеки <a href
 * ='https://github.com/altiore/form'>@altiore/form</a>.
 */

export const Form = <Values extends Record<string, any> = Record<string, any>>({
	children,
	defaultValues,
	onSubmit,
	...props
}: FormProps<Values>): JSX.Element => {
	const formRef = useRef<HTMLFormElement>(null);
	const [fields, setFields] = useState<FormContextState['fields']>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const setErrors = useCallback(
		(fieldName: string, errors: string[], force?: boolean) => {
			setFields((s) => {
				if (!s[fieldName]) {
					// этот код, похоже, никогда не выполняется и здесь лишь для совместимости
					return s;
				}

				const fieldData = {
					...s[fieldName],
					error: errors?.[0],
					errors,
					isInvalid: Boolean(errors?.length),
					isUntouched: false,
				};
				// улучает производительность, избегая рендера, если ошибки не изменились
				if (isEqual(s[fieldName], fieldData) && !force) {
					return s;
				}
				return {
					...s,
					[fieldName]: fieldData,
				};
			});
		},
		[setFields],
	);

	const setNestedErrors = useCallback(
		(errors: Record<string, any>) => {
			toFlatErrors(errors, setErrors);
		},
		[setErrors],
	);

	const setItems = useCallback(
		(
			fieldName: string,
			setItemsArg: (i: number[]) => number[],
			getErrors,
			defaultValue?: any,
		) => {
			setFields((s) => {
				const items = setItemsArg(s[fieldName].items);
				const errors = getErrors(items);
				return {
					...s,
					[fieldName]: {
						...s[fieldName],
						defaultValue,
						error: errors?.[0],
						errors,
						isInvalid: Boolean(errors?.length),
						isUntouched: false,
						items,
					},
				};
			});
		},
		[setFields],
	);

	const registerField = useCallback(
		(
			fieldName: string,
			fieldType: FieldType,
			fieldDefaultValue?: any,
			validators?: Array<ValidateFunc>,
		) => {
			setFields((s): FormContextState['fields'] => {
				const fieldNameArr = fieldName.split('.');

				let dynamicDefault: any = undefined;
				const fieldNameArrLength = fieldNameArr.length;
				if (fieldNameArrLength > 2) {
					const defValueFromPar =
						s?.[fieldNameArr.slice(0, fieldNameArrLength - 2).join('.')]
							?.defaultValue;
					dynamicDefault = Array.isArray(defValueFromPar)
						? undefined
						: defValueFromPar
						? defValueFromPar?.[fieldNameArr[fieldNameArrLength - 1]] || ' '
						: undefined;
				}
				const defaultValue =
					dynamicDefault ??
					get(defaultValues, fieldNameArr) ??
					fieldDefaultValue;

				return {
					...s,
					[fieldName]: {
						defaultValue,
						error: undefined,
						errors: [],
						isInvalid: false,
						// Этот флаг работает только для полей у которых есть валидаторы
						isUntouched: true,
						items:
							fieldType === FieldType.ARRAY
								? Array.isArray(defaultValue)
									? defaultValue.map(getItemsFromDefVal)
									: []
								: undefined,
						name: fieldName,
						setErrors: setErrors.bind({}, fieldName),
						type: fieldType,
						validators: validators ? validators : [],
					},
				};
			});

			return () => {
				setFields((s) => {
					const newState: any = {
						...s,
						[fieldName]: undefined,
					};
					delete newState[fieldName];
					return newState;
				});
			};
		},
		[defaultValues, setFields],
	);

	const handleSubmit = useCallback(
		(evt?: FormEvent) => {
			const localSubmitFunc = typeof evt === 'function' ? evt : onSubmit;
			if (evt?.preventDefault) {
				evt.preventDefault();
			}

			// 1. Validate
			let isFormInvalid = false;
			Object.entries(fields).forEach(([fieldName, fieldMeta]: any) => {
				if (fieldMeta.validators) {
					const type: FieldType = fieldMeta.type || FieldType.TEXT;
					let value: any;
					if (type === FieldType.ARRAY) {
						// TODO: для элемента массива получить все данные из вложеных инпутов
						value = fieldMeta.items;
					} else {
						const target = getNodeByName(fieldMeta.name, formRef);
						value = target?.current
							? getValueByTypeAndTarget(type, target.current as any)
							: null;
					}
					const errors: string[] = [];
					fieldMeta.validators.forEach((validate: ValidateFunc) => {
						const error = validate(value);
						if (error) {
							isFormInvalid = true;
							errors.push(error);
						}
					});
					setErrors(fieldName, errors);
				}
			});
			if (isFormInvalid) {
				setIsSubmitting(false);
				return Promise.resolve();
			}

			// 2. Send data
			const formData = new window.FormData(formRef.current ?? undefined);
			const values: Record<string, unknown> = {};
			const fewValues: any[] = [];

			formData.forEach((value: unknown, name: string) => {
				const prevValue = get(values, name);
				if (prevValue) {
					if (fewValues.length === 0) {
						fewValues.push(prevValue);
					}
					fewValues.push(value);

					set(values, name, fewValues);
				} else {
					set(values, name, value);
				}
			});
			const resValues: Record<string, unknown> = cloneDeep(values);

			Object.keys(fields)
				.reverse()
				.forEach((fieldKey) => {
					const items = fields[fieldKey].items;
					const fieldType = fields[fieldKey].type;

					if (Array.isArray(items)) {
						const value = items.map((index: number) => {
							return (cloneDeep(get(resValues, fieldKey)) as any[])[index];
						});

						unset(resValues, fieldKey);
						set(resValues, fieldKey, value);
					} else {
						const prepareValue = getValueByType.get(fieldType) || parseDefault;

						if (prepareValue) {
							const typedValue = prepareValue(get(resValues, fieldKey) as any);

							set(resValues, fieldKey, typedValue);
						}
					}
				});

			setIsSubmitting(true);
			Promise.resolve(
				localSubmitFunc(resValues as Values, setNestedErrors, evt),
			)
				.then(function () {
					setIsSubmitting(false);
				})
				.catch(console.error);
		},
		[fields, onSubmit, setIsSubmitting, setErrors, setNestedErrors],
	);

	return (
		<form {...props} onSubmit={handleSubmit} ref={formRef}>
			<FormContext.Provider
				value={{
					fields,
					formRef,
					isSubmitting,
					onSubmit: handleSubmit,
					registerField,
					setItems,
				}}>
				{children}
			</FormContext.Provider>
		</form>
	);
};

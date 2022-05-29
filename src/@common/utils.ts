import {MutableRefObject} from 'react';

import {FieldType, InputType} from '~/@common/types';

export const getNodeByName = <T>(
	name: string,
	formRef?: MutableRefObject<HTMLFormElement>,
): null | MutableRefObject<T> => {
	if (formRef?.current) {
		const input = formRef.current.querySelector(`[name="${name}"]`) as any;
		if (input) {
			return {
				current: input,
			} as MutableRefObject<T>;
		}
	} else {
		const input = document.querySelector(`[name="${name}"]`) as any;
		if (input) {
			return {
				current: input,
			} as MutableRefObject<T>;
		}
	}

	return null;
};

export const getValueByNodeName = (
	name: string,
	formRef?: MutableRefObject<HTMLFormElement>,
): any => {
	const foundInputRef = getNodeByName<any>(name, formRef);
	if (foundInputRef) {
		return foundInputRef.current.type === 'checkbox'
			? foundInputRef.current.checked
			: foundInputRef.current.value;
	}

	return null;
};

const getValue = (target: HTMLElement) => (target as HTMLInputElement).value;
const getChecked = (target: HTMLElement) =>
	(target as HTMLInputElement).checked;
const getMultipleSelect = (target: HTMLElement) =>
	[...(target as any).options]
		.filter((el) => el.selected)
		.map((el) => el.value);

const getValueByType = new Map<FieldType, (evt: any) => any>([
	[FieldType.BOOLEAN, getChecked],
	[FieldType.CHECKBOX, getChecked],
	[FieldType.NUMBER, getValue],
	[FieldType.FLOAT, getValue],
	[FieldType.TEXT, getValue],
	[FieldType.SELECT_MULTIPLE, getMultipleSelect],
]);

export const getValueByTypeAndTarget = (
	type: FieldType,
	target: EventTarget | HTMLElement,
): any => {
	const getCurrentValue = getValueByType.get(type) ?? getValue;
	return getCurrentValue(target);
};

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

export const parseValueByType = new Map([
	[FieldType.TEXT, parseDefault],
	[FieldType.BOOLEAN, parseBoolean],
	[FieldType.NUMBER, parseNumber],
	[FieldType.FLOAT, parseFloat],
	[FieldType.SELECT_MULTIPLE, toArray],
]);

export const inputTypeByType = new Map<FieldType, InputType>([
	[FieldType.BOOLEAN, 'checkbox'],
	[FieldType.CHECKBOX, 'checkbox'],
	[FieldType.ENUM, 'text'],
	[FieldType.PASSWORD, 'password'],
	[FieldType.EMAIL, 'email'],
	[FieldType.TEXT, 'text'],
	[FieldType.NUMBER, 'number'],
	[FieldType.FLOAT, 'number'],
]);

export const getInputTypeByFieldType = (fieldType: FieldType): InputType => {
	return inputTypeByType.has(fieldType)
		? inputTypeByType.get(fieldType)
		: (fieldType as InputType);
};

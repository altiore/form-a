import React, {useMemo} from 'react';

import {useRegisterField} from '~/@common/hooks/use-register-field';
import {NamedFieldProps} from '~/@common/types';

import ValidatedFieldArray, {
	ValidatedFieldArrayProps,
} from './validated-field-array';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const NamedFieldArray = <T,>({
	fieldArrayState,
	formState,
	providedName,
	...rest
}: NamedFieldProps<
	ValidatedFieldArrayProps<T>,
	'field' | 'name' | 'setItems'
>) => {
	const {field, isInsideForm, name} = useRegisterField(
		fieldArrayState,
		formState,
		providedName,
		true,
	);

	const setItems = useMemo(() => formState?.setItems, [formState?.setItems]);

	if (isInsideForm && !field) {
		return null;
	}

	return (
		<ValidatedFieldArray
			{...rest}
			field={field}
			setItems={setItems}
			name={name}
		/>
	);
};

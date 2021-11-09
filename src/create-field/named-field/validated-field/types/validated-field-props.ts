import {FieldMeta, FieldType, ValidateFuncType} from '~/@common/types';

import {InternalFieldProps} from './internal-field-props';

export interface ValidatedFieldProps<T> {
	component: (
		props: Omit<T, 'validators'> & InternalFieldProps & FieldMeta,
	) => JSX.Element;
	componentProps: T;
	field: FieldMeta;
	name: string;
	type?: FieldType;
	validators: Array<ValidateFuncType>;
}

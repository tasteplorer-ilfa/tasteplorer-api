import { UserInputError } from '@nestjs/apollo';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export class InputValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  public transform(value: any, metadata: ArgumentMetadata) {
    const { error } = this.schema.validate(value);

    if (error) {
      throw new UserInputError(error.details[0].message);
    }

    return value;
  }
}

import { AllOptions, FindOperationResult, FindOptions, Item, ItemQuery, PriKey, QueryParams } from "@fjell/types";
import { paramsToQuery } from "@fjell/core";
import { validatePK } from "@fjell/validation";
import { Request, Response } from "express";
import { ItemRouter, ItemRouterOptions } from "./ItemRouter.js";
import { Library, NotFoundError } from "@fjell/lib";
import {
  resolvePagination,
  resolveQueryLimits,
  stripQueryMetaParams,
} from "./util/queryPagination.js";
import {
  validateFinderName,
  validateOneParam,
} from "./util/requestValidation.js";

interface ParsedQuery {
  [key: string]: undefined | string | string[] | ParsedQuery | ParsedQuery[];
}

export class PItemRouter<T extends Item<S>, S extends string> extends ItemRouter<S> {

  constructor(lib: Library<T, S>, keyType: S, options: ItemRouterOptions<S, never, never, never, never, never> = {}) {
    super(lib as any, keyType, options);
  }

  public getIk(res: Response): PriKey<S> {
    const pri = this.getPk(res) as PriKey<S>;
    return pri
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createItem = async (req: Request, res: Response, next?: any) => {
    const libOperations = this.lib.operations;
    this.logger.default('Creating Item', { body: req.body, query: req.query, params: req.params, locals: res.locals });

    try {
      const itemToCreate = this.convertDates(req.body as Item<S>);
      let item = validatePK(await libOperations.create(itemToCreate), this.getPkType()) as Item<S>;
      item = await this.postCreateItem(item);
      this.logger.default('Created Item %j', item);
      res.status(201).json(item);
    } catch (error: any) {
      // Check for validation errors - check multiple patterns
      // Also check error.cause since errors may be wrapped
      const originalError = error?.cause || error;

      // Log structured error details for agentic debugging
      this.logger.error('Error in createItem endpoint', {
        component: 'PItemRouter',
        operation: 'createItem',
        endpoint: req.path,
        method: req.method,
        itemType: this.getPkType(),
        requestBody: JSON.stringify(req.body),
        error,
        errorName: error?.name,
        errorMessage: error?.message,
        errorCode: error?.errorInfo?.code || error?.code,
        originalErrorName: originalError?.name,
        originalErrorMessage: originalError?.message,
        originalErrorCode: originalError?.errorInfo?.code || originalError?.code,
        validationErrors: error?.errorInfo?.details?.fieldErrors || originalError?.errorInfo?.details?.fieldErrors,
        suggestion: 'Check request body validation, required fields, unique constraints, and data types',
        stack: error?.stack
      });
      const isValidationError =
        error.name === 'CreateValidationError' ||
        originalError?.name === 'CreateValidationError' ||
        error.name === 'ValidationError' ||
        originalError?.name === 'ValidationError' ||
        error.name === 'SequelizeValidationError' ||
        originalError?.name === 'SequelizeValidationError' ||
        error?.errorInfo?.code === 'VALIDATION_ERROR' ||
        originalError?.errorInfo?.code === 'VALIDATION_ERROR' ||
        (error.message && (
          error.message.includes('validation') ||
          error.message.includes('required') ||
          error.message.includes('cannot be null') ||
          error.message.includes('notNull Violation') ||
          error.message.includes('Required field') ||
          error.message.includes('Referenced item does not exist') ||
          error.message.includes('Foreign key constraint') ||
          error.message.includes('Operation failed') ||
          error.message.includes('preCreate') ||
          error.message.includes('preUpdate') ||
          error.message.includes('Create Validation Failed')
        )) ||
        (originalError?.message && (
          originalError.message.includes('validation') ||
          originalError.message.includes('required') ||
          originalError.message.includes('cannot be null') ||
          originalError.message.includes('notNull Violation') ||
          originalError.message.includes('Required field') ||
          originalError.message.includes('Referenced item does not exist') ||
          originalError.message.includes('Foreign key constraint') ||
          originalError.message.includes('preCreate') ||
          originalError.message.includes('preUpdate') ||
          originalError.message.includes('Create Validation Failed')
        ));

      if (isValidationError) {
        const errorMessage = originalError?.message || error.message || "Validation failed";
        res.status(400).json({ success: false, error: errorMessage });
      } else {
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
      }
    }
  };

  protected findItems = async (req: Request, res: Response) => {
    const libOperations = this.lib.operations;
    this.logger.default('Finding Items', { query: req.query, params: req.params, locals: res.locals });

    try {
      const query: ParsedQuery = req.query as unknown as ParsedQuery;
      const finder = query['finder'] as string;
      const finderParams = query['finderParams'] as string;
      const one = query['one'] as string;
      const finderError = validateFinderName(finder);
      if (finderError) {
        res.status(400).json(finderError);
        return;
      }
      const oneError = validateOneParam(one);
      if (oneError) {
        res.status(400).json(oneError);
        return;
      }
      const queryLimits = resolveQueryLimits(this.options.queryLimits);

      const pagination = resolvePagination(req.query.limit, req.query.offset, queryLimits);
      if (!pagination.ok) {
        res.status(400).json({
          error: pagination.error,
          field: pagination.field,
        });
        return;
      }

      if (finder) {
        this.logger.default('Finding Items with Finder %s %j one:%s', finder, finderParams, one);

        let parsedParams: any;
        try {
          parsedParams = finderParams ? JSON.parse(finderParams) : {};
        } catch (parseError: any) {
          res.status(400).json({
            error: 'Invalid JSON in finderParams',
            message: parseError.message
          });
          return;
        }

        const findOptions: FindOptions = {
          limit: pagination.limit,
          offset: pagination.offset,
        };

        if (one === 'true') {
          const item = await (this.lib as any).findOne(finder, parsedParams);
          const validatedItem = item ? (validatePK(item, this.getPkType()) as Item<S>) : null;
          const result: FindOperationResult<Item<S>> = {
            items: validatedItem ? [validatedItem] : [],
            metadata: {
              total: validatedItem ? 1 : 0,
              returned: validatedItem ? 1 : 0,
              offset: 0,
              hasMore: false
            }
          };
          res.json(result);
        } else {
          const result = await libOperations.find(finder, parsedParams, [], findOptions);
          const validatedItems = validatePK(result.items, this.getPkType()) as Item<S>[];

          res.json({
            items: validatedItems,
            metadata: result.metadata
          });
        }
      } else {
        // Strip pagination/finder meta keys so they don't pollute ItemQuery (e.g. limit: NaN)
        let itemQuery: ItemQuery;
        try {
          itemQuery = paramsToQuery(stripQueryMetaParams(req.query as Record<string, unknown>) as QueryParams);
        } catch (parseError: any) {
          res.status(400).json({
            error: 'Invalid query parameter',
            message: parseError?.message || 'Failed to parse query parameters',
          });
          return;
        }
        this.logger.default('Finding Items with a query %j', itemQuery);

        const allOptions: AllOptions = {
          limit: pagination.limit,
          offset: pagination.offset,
        };

        const result = await libOperations.all(itemQuery, [], allOptions);
        const validatedItems = result.items.map((item: Item<S>) => validatePK(item, this.getPkType()));

        res.json({
          items: validatedItems,
          metadata: result.metadata
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Internal server error';

      this.logger.error('Error in findItems', {
        errorMessage,
        errorName: error?.name,
        errorCode: error?.code,
        finder: (req.query as any)?.finder,
        requestPath: req.path,
        requestMethod: req.method
      });

      if (error instanceof NotFoundError || error?.name === 'NotFoundError') {
        res.status(404).json({ error: errorMessage });
      } else {
        const isDevelopment = process.env.NODE_ENV === 'development';
        res.status(500).json({
          error: errorMessage,
          ...(isDevelopment && {
            details: error?.name,
            stack: error?.stack
          })
        });
      }
    }
  };

}

import { isURL, registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export function IsArrayLength(options: {max:number,min?:number}|{max?:number,min:number}, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsArrayLength',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [options],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    // const relatedValue = (args.object as any)[relatedPropertyName];
                    if(!Array.isArray(value))
                        return false
                    if(options.max && value.length > options.max)
                        return false
                    if(options.min && value.length < options.min)
                        return false
                    return true
                },
            },
        });
    };
}

export function IsRegExp(reg: RegExp|RegExp[], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsRegExp',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [reg],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const regList = Array.isArray(reg) ? reg : [reg];
                    return typeof value== 'string'&& regList.every(v=>v.test(value));
                },
            },
        });
    };
}

export enum FILE_TYPE {
    image = 'image',
    video = 'video',
    audio = 'audio',
    file = 'file',
    excel = 'excel',
    word = 'word',
    pdf = 'pdf',
    apk = 'apk',
}
export const FILE_TYPE_REG = {
    [FILE_TYPE.image]:/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i,
    [FILE_TYPE.video]:/\.(mp4|avi|rm|rmvb|wmv|flv|3gp|mov|mpeg|mpg|mkv|vob)$/i,
    [FILE_TYPE.audio]:/\.(mp3|wav|wma|ogg|ape|acc)$/i,
    [FILE_TYPE.file]:/\.(txt|doc|docx|xls|xlsx|ppt|pptx|pdf|rar|zip|7z|tar|gz|bz2)$/i,
    [FILE_TYPE.excel]:/\.(xls|xlsx)$/i,
    [FILE_TYPE.word]:/\.(doc|docx)$/i,
    [FILE_TYPE.pdf]:/\.(pdf)$/i,
    [FILE_TYPE.apk]:/\.(apk)$/i,
}

export function UrlType(type: FILE_TYPE|FILE_TYPE[], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'UrlType',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [type],
            options: validationOptions,
            validator: {
                validate(value: string, args: ValidationArguments) {
                    const regList = Array.isArray(type) ? type : [type];
                    //判断文件后缀是否符合要求
                    return regList.every(v=>{
                        const reg = FILE_TYPE_REG[v];
                        return reg.test(value);
                    })
                },
            },
        });
    };
}


//检测是否为有效URL
export function IsUrl(options:any,validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsUrl',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: string, args: ValidationArguments) {
                    return isURL(encodeURI(value),options);
                },
            },
        });
    };
}

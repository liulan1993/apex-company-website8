'use client';

import React, { useState, useMemo, useEffect, ChangeEvent, Dispatch, SetStateAction, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// --- 类型定义 ---
type Option = { value: string; label: string };
type Column = { key: string; header: string };
type Field = { id: string; Component: FC<any>; label?: string; title?: string; [key: string]: any };
type Service = { id: string; title: string; fields: Field[] };
type FormData = { [key: string]: any };

// --- 工具函数 ---
function cn(...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]): string {
    const classSet = new Set<string>();
    inputs.forEach(input => {
        if (typeof input === 'string') {
            input.split(' ').forEach(cls => cls && classSet.add(cls));
        } else if (typeof input === 'object' && input !== null) {
            Object.entries(input).forEach(([key, value]) => {
                if (value) classSet.add(key);
            });
        }
    });
    return Array.from(classSet).join(' ');
}

// --- 表单组件定义 ---
const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6 mt-6 first:mt-0">{title}</h3>
);

const SubHeader = ({ title }: { title: string }) => (
    <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-4">{title}</h4>
);

const FormField = ({ label, type = 'text', placeholder, value, onChange }: { label: string, type?: string, placeholder?: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
        <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            type={type} 
            placeholder={placeholder} 
            value={value || ''}
            onChange={onChange}
        />
    </div>
);

const SelectField = ({ label, name, options, value, onChange }: { label: string, name: string, options: Option[], value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void }) => (
     <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
        <select 
            name={name} 
            value={value}
            onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </div>
);


const FileUploadField = ({ label, onFileChange, fileError }: { label: string, onFileChange: (file: File) => void, fileError?: string }) => {
    const [fileName, setFileName] = useState('');
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileChange(file);
        }
    };
    return (
        <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h4a4 4 0 014 4v5a4 4 0 01-4 4H7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 9l-3 3-3-3" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">点击上传</span> 或拖拽文件到此区域
                    </p>
                    <p className="text-xs text-gray-500 mt-1">文件大小不超过 10MB</p>
                    {fileName && <p className="text-sm text-green-600 mt-2 font-semibold">{fileName}</p>}
                    {fileError && <p className="text-sm text-red-600 mt-2 font-semibold">{fileError}</p>}
                </div>
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
            </div>
        </div>
    );
};

const RadioGroupField = ({ label, name, options, value, onChange }: { label: string, name: string, options: Option[], value: string, onChange: (e: { target: {name: string, value: string} }) => void }) => (
    <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
        <div className="flex items-center space-x-4 flex-wrap">
            {options.map(option => (
                <label key={option.value} className="flex items-center mr-4 mb-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        name={name} 
                        value={option.value} 
                        checked={value === option.value} 
                        onChange={(e) => {
                             const newValue = e.target.value;
                             const finalValue = value === newValue ? '' : newValue;
                             onChange({ target: { name, value: finalValue }});
                        }} 
                        className="mr-2 h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    {option.label}
                </label>
            ))}
        </div>
    </div>
);

const CheckboxGroupField = ({ label, value = [], onChange, options }: { label: string, value: string[], onChange: (e: ChangeEvent<HTMLInputElement>) => void, options: Option[] }) => (
    <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {options.map(option => (
                <label key={option.value} className="flex items-center whitespace-nowrap cursor-pointer">
                    <input 
                        type="checkbox" 
                        value={option.value}
                        checked={value.includes(option.value)}
                        onChange={onChange}
                        className="mr-2 h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                    {option.label}
                </label>
            ))}
        </div>
    </div>
);


const TextareaField = ({ label, placeholder, value, onChange }: { label: string, placeholder?: string, value: string, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) => (
    <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
        <textarea 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            rows={4} 
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        ></textarea>
    </div>
);

const TableField = ({ label, columns, value = [], onChange }: { label: string, columns: Column[], value: any[], onChange: (value: any[]) => void }) => {
    const safeColumns = Array.isArray(columns) ? columns : [];
    const columnsString = JSON.stringify(safeColumns);

    useEffect(() => {
        if (value.length === 0 && safeColumns.length > 0) {
            const newRow = safeColumns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
            onChange([newRow]);
        }
    }, [columnsString, value.length, onChange]);

    const handleAddRow = () => {
        const newRow = safeColumns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {});
        onChange([...value, newRow]);
    };

    const handleRemoveRow = (index: number) => {
        const newRows = [...value];
        newRows.splice(index, 1);
        onChange(newRows);
    };

    const handleCellChange = (rowIndex: number, columnKey: string, cellValue: string) => {
        const newRows = [...value];
        newRows[rowIndex][columnKey] = cellValue;
        onChange(newRows);
    };

    return (
        <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-left">{label}</label>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            {safeColumns.map(col => <th key={col.key} scope="col" className="px-4 py-3">{col.header}</th>)}
                            <th scope="col" className="px-4 py-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.map((row, rowIndex) => (
                            <tr key={rowIndex} className="bg-white border-b">
                                {safeColumns.map(col => (
                                    <td key={col.key} className="px-4 py-3">
                                        <input
                                            type="text"
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                                            value={row[col.key] || ''}
                                            onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                                        />
                                    </td>
                                ))}
                                <td className="px-4 py-3">
                                    <button type="button" onClick={() => handleRemoveRow(rowIndex)} className="text-red-600 hover:text-red-900">删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={handleAddRow} className="mt-2 text-blue-600 hover:text-blue-900 font-semibold text-sm">+ 添加一行</button>
        </div>
    );
};

const DynamicPersonField = ({ title, personType, value = [], onChange, fieldSet, max }: { title?: string, personType: string, value: any[], onChange: (value: any[]) => void, fieldSet: any[], max?: number }) => {
    
    const handleAdd = () => {
        if (!max || value.length < max) {
            onChange([...value, {}]);
        }
    };
    
    const handleRemove = (index: number) => {
        const newValues = [...value];
        newValues.splice(index, 1);
        onChange(newValues);
    };

    const handleChange = (index: number, fieldId: string, fieldValue: any) => {
        const newValues = [...value];
        newValues[index] = { ...newValues[index], [fieldId]: fieldValue };
        onChange(newValues);
    };
    
    return (
        <div>
            {title && <SectionHeader title={title} />}
            {value.map((personData, index) => (
                <div key={index} className="p-4 border rounded-lg mb-4 relative bg-gray-50">
                     <h4 className="font-semibold text-gray-700 mb-4">{personType} {index + 1}</h4>
                     <button type="button" onClick={() => handleRemove(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                     {fieldSet.map(field => {
                         const {Component, id, ...props} = field;
                         const fieldId = `${id}_${index}`;
                         return <Component key={id} {...props} value={personData[id] || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, id, e.target.value)} />
                     })}
                </div>
            ))}
            {(!max || value.length < max) && (
                 <button type="button" onClick={handleAdd} className="mt-2 text-blue-600 hover:text-blue-900 font-semibold text-sm">+ 添加{personType}</button>
            )}
        </div>
    );
};


// --- 服务模块及所需字段的数据结构 ---
const clientAgentFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
];

const directorFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'gender', label: '性别', name:'director_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'dob', label: '出生日期', type: 'date', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'email', label: '邮箱地址', Component: FormField },
];

const shareholderFields: Field[] = [
    { id: 'fullName', label: '全名/公司名', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码/公司注册号(UEN)', Component: FormField },
    { id: 'gender', label: '性别', name:'shareholder_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'address', label: '住家地址/公司注册地址/公司运营地址', Component: FormField },
    { id: 'dob', label: '出生日期/公司注册日期', type: 'date', Component: FormField },
    { id: 'nationality', label: '国籍/公司注册地', Component: FormField },
    { id: 'shares', label: '持股数量', type: 'number', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'email', label: '邮箱地址', Component: FormField },
];

const uboFields: Field[] = [
    { id: 'fullName', label: '全名 (包括任何别名)', Component: FormField },
    { id: 'idNumber', label: '身份证/护照号码', Component: FormField },
    { id: 'gender', label: '性别', name:'ubo_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
    { id: 'expiry', label: '身份证 & 护照有效期', type: 'date', Component: FormField },
    { id: 'homeAddress', label: '住家地址', Component: FormField },
    { id: 'nationality', label: '国籍', Component: FormField },
    { id: 'contactNumber', label: '联系号码', Component: FormField },
    { id: 'dob', label: '出生日期', type: 'date', Component: FormField },
    { id: 'ownershipInfo', label: '请提供实际受益所有权的性质信息', placeholder: '例如: 拥有超过25%的所有权', Component: TextareaField },
];

const contactFields: Field[] = [
    { id: 'name', label: '姓名', Component: FormField },
    { id: 'id', label: '新加坡身份证/护照号码', Component: FormField },
    { id: 'mobile', label: '手机号码', Component: FormField },
    { id: 'officePhone', label: '办公电话号码', Component: FormField },
    { id: 'email', label: '电邮地址', Component: FormField },
];


const services: Service[] = [
    {
        id: 'company-registration', 
        title: '新加坡公司注册信息表',
        fields: [
            { id: 'reg_partA_clients', title: 'A部分: 客户/代理人信息', personType: '客户/代理人', fieldSet: clientAgentFields, Component: DynamicPersonField },
            { id: 'reg_partA_entity_header', title: '拟注册商业实体信息', Component: SubHeader },
            { id: 'reg_partA_entityName1', label: '实体名称 - 第一选择', placeholder:'按优先顺序', Component: FormField },
            { id: 'reg_partA_entityName2', label: '实体名称 - 第二选择', Component: FormField },
            { id: 'reg_partA_entityName3', label: '实体名称 - 第三选择', Component: FormField },
            { id: 'reg_partA_regAddress', label: '拟注册公司地址', Component: FormField },
            { id: 'reg_partA_opAddress', label: '拟注册公司运营地址', Component: FormField },
            { id: 'reg_partA_bizCountries', label: '企业主要开展业务的国家', placeholder:'1.国家 2.国家 3.国家', Component: TextareaField },
            { id: 'reg_partA_bizScope', label: '拟注册公司营业范围简介', Component: TextareaField },
            { id: 'reg_partA_capital', label: '公司注册金额 (新币)', type: 'number', Component: FormField },
            
            { id: 'reg_partB_directors', title: 'B部分: 公司董事信息 (至少一名新加坡本地董事)', personType: '董事', fieldSet: directorFields, Component: DynamicPersonField },
            { id: 'reg_partB_docs_header', title: '董事所需文件', Component: SubHeader },
            { id: 'reg_partB_doc_sg', label: '新加坡身份证复印件', Component: FileUploadField },
            { id: 'reg_partB_doc_ep', label: '新加坡工作准证 (EP) 复印件', Component: FileUploadField },
            { id: 'reg_partB_doc_passport', label: '护照复印件和经公证的地址证明', Component: FileUploadField },
            
            { id: 'reg_partC_shareholders', title: 'C部分: 公司股东信息 (个人/机构)', personType: '股东', fieldSet: shareholderFields, Component: DynamicPersonField },
            { id: 'reg_partC_docs_header', title: '个人股东所需文件', Component: SubHeader },
            { id: 'reg_partC_doc_sg_sh', label: '新加坡身份证复印件 (个人股东)', Component: FileUploadField },
            { id: 'reg_partC_doc_ep_sh', label: '新加坡工作准证 (EP) 复印件 (个人股东)', Component: FileUploadField },
            { id: 'reg_partC_doc_passport_sh', label: '护照复印件和经公证的地址证明 (个人股东)', Component: FileUploadField },
            
            { id: 'reg_partC_corp_docs_header', title: '如果股东是公司, 请提供以下文件', Component: SubHeader },
            { id: 'reg_partC_doc_incorp', label: '公司成立证书', Component: FileUploadField },
            { id: 'reg_partC_doc_moa', label: '公司章程或备忘同文件', Component: FileUploadField },
            { id: 'reg_partC_doc_bizfile', label: '公司注册商业档案 (Bizfile)', Component: FileUploadField },

            { id: 'reg_partD_ubos', title: 'D部分: 最终受益人信息', personType: '最终受益人', fieldSet: uboFields, Component: DynamicPersonField },
            
            { id: 'reg_partE_header', title: 'E部分: 财务年度截止日', Component: SectionHeader },
            { id: 'reg_partE_fye', label: '拟注册公司财务年度截止日应定为', type:'date', placeholder:'每个公历年的 [日期]', Component: FormField },

            { id: 'reg_partF_header', title: 'F部分: 政治公众人物、其直系亲属及密切关系人信息', Component: SectionHeader },
            { id: 'reg_partF_q1', label:'1. 上述人员中是否有任何⼈是政治公众人物?', name:'pep_q1', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_q2', label:'2. 上述人员中是否有任何⼈是已卸任的政治公众⼈物?', name:'pep_q2', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_q3', label:'3. 上述人员中是否有任何⼈与政治公众⼈物或已卸任的政治公众人物属于直系亲属或密切关系人?', name:'pep_q3', options:[{label:'是',value:'yes'}, {label:'否',value:'no'}], Component: RadioGroupField},
            { id: 'reg_partF_note', title:'注意: 请为每位政治公众人物, 其直系亲属或密切关系人填写一份政治公众人物 (PEP) 表格。', Component: SubHeader },

            { id: 'reg_partG_header', title: '授权与声明', Component: SectionHeader },
            { id: 'reg_partG_declaration', title:'本人声明, 本表格中所提供的信息真实且正确...', Component: SubHeader },
            { id: 'reg_partG_signature', label:'客户/代理签名', Component: FormField },
            { id: 'reg_partG_id', label:'身份证/护照号', Component: FormField },
        ]
    },
    { 
        id: 'health-assessment',
        title: '健康溯源体检评估表',
        fields: [
            { id: 'ha_s1_header', title: '一、基本信息', Component: SectionHeader },
            { id: 'ha_s1_name', label: '姓名', placeholder: '请输入姓名', Component: FormField },
            { id: 'ha_s1_dob', label: '出生日期', type: 'date', Component: FormField },
            { id: 'ha_s1_gender', label: '性别', name: 'ha_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
            { id: 'ha_s1_contact', label: '联系方式 (手机号/微信)', placeholder: '请输入联系方式', Component: FormField },
            { id: 'ha_s2_header', title: '二、生活方式', Component: SectionHeader },
            { id: 'ha_s2_exercise', label: '运动频率', name: 'ha_exercise', options: [{label:'每周3次以上', value:'high'}, {label:'偶尔', value:'low'}, {label:'很少', value:'none'}], Component: RadioGroupField },
            { id: 'ha_s2_diet', label: '饮食习惯', name: 'ha_diet', options: [{label:'高盐高油', value:'unhealthy'}, {label:'偏素食', value:'veg'}, {label:'较多不规律饮食', value:'irregular'}], Component: RadioGroupField },
            { id: 'ha_s2_sleep', label: '睡眠情况', name: 'ha_sleep', options: [{label:'良好', value:'good'}, {label:'经常失眠/多梦', value:'insomnia'}, {label:'白天易疲劳', value:'fatigue'}], Component: RadioGroupField },
            { id: 'ha_s2_smoking', label: '是否吸烟', name:'ha_smoking', options: [{label:'请选择', value:''}, {label:'否', value:'no'}, {label:'是', value:'yes'}], Component: SelectField },
            { id: 'ha_s2_drinking', label: '是否饮酒', name:'ha_drinking', options: [{label:'请选择', value:''}, {label:'否', value:'no'}, {label:'是', value:'yes'}], Component: SelectField },
            { id: 'ha_s3_header', title: '三、家族重大疾病史', Component: SectionHeader },
            { id: 'ha_s3_familyHistory', label: '疾病史 (可多选)', options: [{label:'高血压', value:'hbp'}, {label:'糖尿病', value:'diabetes'}, {label:'心脑血管疾病', value:'cvd'}, {label:'癌症', value:'cancer'}, {label:'自身免疫疾病', value:'autoimmune'}, {label:'其他', value:'other'}, {label:'无明显家族病史', value:'none'}], Component: CheckboxGroupField },
            { id: 'ha_s4_header', title: '四、已有确诊病史或关注的健康问题', Component: SectionHeader },
            { id: 'ha_s4_diagnosed', label: '确诊病史 (可多选)', options: [{label:'甲状腺结节', value:'thyroid'}, {label:'血脂异常', value:'dyslipidemia'}, {label:'胃肠不适', value:'gi'}, {label:'乳腺结节/子宫肌瘤', value:'fibroid'}, {label:'肝胆结石/息肉', value:'gallstone'}, {label:'高血压/高血糖', value:'hbp_hbg'}, {label:'其他', value:'other'}], Component: CheckboxGroupField },
            { id: 'ha_s5_header', title: '五、目前已做过的检查', Component: SectionHeader },
            { id: 'ha_s5_tests', label: '检查项目 (可多选)', options: [{label:'常规体检(血常规, B超)', value:'routine'}, {label:'肿瘤筛查(如CEA, CA125等)', value:'tumor'}, {label:'胃肠镜检查', value:'endoscopy'}, {label:'心脑血管影像检查(CTA, 脑MRI)', value:'cardio_cta'}, {label:'无法确认(仅上传报告)', value:'upload_only'}], Component: CheckboxGroupField },
            { id: 'ha_s6_header', title: '六、服务目标', Component: SectionHeader },
            { id: 'ha_s6_goals', label: '服务目标 (可多选)', options: [{label:'看懂自己的体检报告', value:'understand_report'}, {label:'是否需要进一步检查', value:'further_check'}, {label:'了解哪些指标有长期变化风险', value:'risk_assess'}, {label:'咨询健康提升建议', value:'advice'}, {label:'帮忙预约体检/医疗资源', value:'booking'}], Component: CheckboxGroupField },
            { id: 'ha_s7_header', title: '七、上传体检报告', Component: SectionHeader },
            { id: 'ha_s7_upload', label: '请上传近3-5年的体检报告PDF或拍照版本', Component: FileUploadField },
            { id: 'ha_s8_header', title: '八、其他补充信息 (可选)', Component: SectionHeader },
            { id: 'ha_s8_extra', label: '补充信息', placeholder: '请输入其他需要说明的信息', Component: TextareaField },
        ]
    },
    { 
        id: 'permit',
        title: '准证申请表',
        fields: [
            { id: 'p_s1_header', title: '一、申请人基本信息', Component: SectionHeader },
            { id: 'p_s1_name', label: '姓名 (拼音)', placeholder: '请输入姓名拼音', Component: FormField },
            { id: 'p_s1_gender', label: '性别', name: 'p_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
            { id: 'p_s1_dob', label: '出生日期', type: 'date', Component: FormField },
            { id: 'p_s1_nationality', label: '国籍', placeholder: '请输入国籍', Component: FormField },
            { id: 'p_s1_passport', label: '护照号码', placeholder: '请输入护照号码', Component: FormField },
            { id: 'p_s1_education', label: '学历 (最高学历)', placeholder: '请输入最高学历', Component: FormField },
            { id: 'p_s1_major', label: '专业', placeholder: '请输入专业', Component: FormField },
            { id: 'p_s1_english', label: '英语能力', options: [{label:'IELTS', value:'ielts'}, {label:'TOEFL', value:'toefl'}, {label:'无', value:'none'}, {label:'其他', value:'other'}], Component: CheckboxGroupField },
            { id: 'p_s1_experience', label: '工作经验 (年)', type: 'number', placeholder: '请输入年数', Component: FormField },
            { id: 'p_s1_occupation', label: '目前职位', placeholder: '请输入当前职位', Component: FormField },
            { id: 'p_s1_address', label: '现居住国家/城市', placeholder: '请输入国家和城市', Component: FormField },
            { id: 'p_s2_header', title: '二、拟申请准证信息', Component: SectionHeader },
            { id: 'p_s2_type', label: '申请类型', name: 'p_type', options: [{label:'EP', value:'ep'}, {label:'DP', value:'dp'}, {label:'LTVP', value:'ltvp'}, {label:'EntrePass', value:'entrepass'}], Component: RadioGroupField },
            { id: 'p_s2_entryDate', label: '预计入境时间', type: 'date', Component: FormField },
            { id: 'p_s2_prevPermit', label: '是否曾申请过新加坡准证', name: 'p_prev', options: [{label:'是', value:'yes'}, {label:'否', value:'no'}], Component: RadioGroupField },
            { id: 'p_s2_prevPermitDetails', label: '如是, 请说明准证类型与时间', placeholder: '例如：Student Pass, 2022-2023', Component: FormField },
            { id: 'p_s3_header', title: '三、雇主公司信息 (如适用)', Component: SectionHeader },
            { id: 'p_s3_companyName', label: '公司名称', placeholder: '请输入公司名称', Component: FormField },
            { id: 'p_s3_uen', label: '公司注册编号 (UEN)', placeholder: '请输入UEN', Component: FormField },
            { id: 'p_s3_title', label: '职位名称', placeholder: '请输入将要入职的职位', Component: FormField },
            { id: 'p_s3_salary', label: '月薪 (新币)', type: 'number', placeholder: '请输入月薪金额', Component: FormField },
            { id: 'p_s3_address', label: '办公地址', placeholder: '请输入办公地址', Component: FormField },
            { id: 'p_s3_contact', label: '联系人姓名 & 电话', placeholder: '请输入HR或联系人信息', Component: FormField },
            { id: 'p_s4_header', title: '四、家庭成员信息 (如适用)', Component: SectionHeader },
            { id: 'p_s4_spouseName', label: '配偶姓名', placeholder: '请输入配偶姓名', Component: FormField },
            { id: 'p_s4_spouseDob', label: '配偶出生日期', type: 'date', Component: FormField },
            { id: 'p_s4_spousePassport', label: '配偶护照号码', placeholder: '请输入配偶护照号', Component: FormField },
            { id: 'p_s4_childName', label: '子女姓名 (如有)', placeholder: '请输入子女姓名', Component: FormField },
            { id: 'p_s4_childDob', label: '子女出生日期', type: 'date', Component: FormField },
            { id: 'p_s4_childPermitType', label: '计划申请准证类型', placeholder: '例如：DP', Component: FormField },
            { id: 'p_s5_header', title: '五、其他补充信息', Component: SectionHeader },
            { id: 'p_s5_extra', label: '补充信息', placeholder: '请输入其他需要说明的信息', Component: TextareaField },
        ]
    },
    {
        id: 'intl-school',
        title: '国际学校申请表',
        fields: [
            { id: 'is_s1_header', title: '一、学生基本信息', Component: SectionHeader },
            { id: 'is_s1_name', label: '学生姓名 (英文)', placeholder: '请输入学生英文姓名', Component: FormField },
            { id: 'is_s1_gender', label: '性别', name: 'is_gender', options: [{label:'男', value:'male'}, {label:'女', value:'female'}], Component: RadioGroupField },
            { id: 'is_s1_dob', label: '出生日期', type: 'date', Component: FormField },
            { id: 'is_s1_nationality', label: '国籍', placeholder: '请输入国籍', Component: FormField },
            { id: 'is_s1_currentSchool', label: '当前就读学校/年级', placeholder: '例如：XX小学/3年级', Component: FormField },
            { id: 'is_s1_englishLevel', label: '英文水平', name: 'is_english', options: [{label:'英文学校背景', value:'english_env'}, {label:'有英文考试成绩', value:'has_score'}, {label:'初学者', value:'beginner'}], Component: RadioGroupField },
            { id: 'is_s1_visa', label: '是否持有新加坡签证', name: 'is_visa', options: [{label:'请选择', value:''}, {label:'否', value:'no'}, {label:'是', value:'yes'}], Component: SelectField },
            { id: 'is_s2_header', title: '二、家庭信息', Component: SectionHeader },
            { id: 'is_s2_parentName', label: '家长姓名', placeholder: '请输入家长姓名', Component: FormField },
            { id: 'is_s2_relation', label: '与学生关系', placeholder: '例如：父亲/母亲', Component: FormField },
            { id: 'is_s2_contact', label: '联系电话 (微信)', placeholder: '请输入联系方式', Component: FormField },
            { id: 'is_s2_parent_email', label: '家长Email', placeholder: '请输入邮箱地址', Component: FormField },
            { id: 'is_s2_address', label: '家庭常住地', placeholder: '请输入城市', Component: FormField },
            { id: 'is_s3_header', title: '三、择校意向', Component: SectionHeader },
            { id: 'is_s3_entryDate', label: '计划入学时间', type: 'date', Component: FormField },
            { id: 'is_s3_entryGrade', label: '期望入读年级', placeholder: '请输入期望年级', Component: FormField },
            { id: 'is_s3_curriculum', label: '期望课程体系 (可多选)', options: [{label:'IB', value:'ib'}, {label:'英式 A-Level', value:'alevel'}, {label:'美式 AP', value:'ap'}, {label:'IPC', value:'ipc'}, {label:'不确定', value:'notsure'}], Component: CheckboxGroupField },
            { id: 'is_s3_preference', label: '学校类型偏好 (可多选)', options: [{label:'注重学术', value:'academic'}, {label:'活动丰富', value:'activity'}, {label:'华人比例高', value:'chinese_ratio'}, {label:'国际氛围浓', value:'international'}], Component: CheckboxGroupField },
            { id: 'is_s3_budget', label: '预计预算范围 (学费/年)', name: 'is_budget', options: [{label:'<$20,000', value:'lt20k'}, {label:'$20-35,000', value:'20to35k'}, {label:'$35,000以上', value:'gt35k'}], Component: RadioGroupField },
            { id: 'is_s4_header', title: '四、未来教育目标', Component: SectionHeader },
            { id: 'is_s4_studyAbroad', label: '孩子是否计划未来出国留学', name: 'is_future_study', options: [{label:'是', value:'yes'}, {label:'否', value:'no'}, {label:'暂不确定', value:'notsure'}], Component: RadioGroupField },
            { id: 'is_s4_targetCountry', label: '计划国家', placeholder: '例如：美国, 英国, 澳大利亚', Component: FormField },
            { id: 'is_s4_support', label: '是否考虑后续升学规划支持服务', name: 'is_support', options: [{label:'是', value:'yes'}, {label:'否', value:'no'}], Component: RadioGroupField },
            { id: 'is_s5_header', title: '五、其他补充信息', Component: SectionHeader },
            { id: 'is_s5_extra', label: '补充信息', placeholder: '如孩子特殊兴趣、身体状况、学习偏好等', Component: TextareaField },
            { id: 'is_s6_header', title: '六、所需文件', Component: SectionHeader },
            { id: 'is_s6_passport', label: '小朋友护照首页 (电子版)', Component: FileUploadField },
            { id: 'is_s6_transcript', label: '小朋友成绩单 (两年)', Component: FileUploadField },
        ]
    },
    {
        id: 'bank-account',
        title: '银行开户',
        fields: [
            { id: 'ba_s1_header', title: '公司信息', Component: SectionHeader },
            { id: 'ba_s1_companyName', label: '公司名称', Component: FormField },
            { id: 'ba_s1_jurisdiction', label: '注册管辖区', Component: FormField },
            { id: 'ba_s1_regDate', label: '注册成立日期', type: 'date', Component: FormField },
            { id: 'ba_s1_mailAddr', label: '银行账户通讯地址', Component: FormField },
            { id: 'ba_s1_currency', label: '开户货币', Component: FormField },
            { id: 'ba_s1_physicalAddr', label: '公司实际地址', Component: FormField },
            { id: 'ba_s1_opArea', label: '主要营业地区', Component: FormField },
            { id: 'ba_s1_directors', label: '所有董事姓名 (与护照全名一致)', Component: TextareaField },
            { id: 'ba_s1_shareholders', label: '所有股东姓名 (与护照全名一致)', Component: TextareaField },
            { id: 'ba_s1_signatories', label: '此银行账户所有授权签署者姓名 (与护照全名一致)', Component: TextareaField },
            { id: 'ba_s2_header', title: '第一最终受益人详情', Component: SectionHeader },
            { id: 'ba_s2_beneficiary1_name', label: '姓名', Component: FormField },
            { id: 'ba_s2_beneficiary1_id', label: '新加坡身份证/护照号码', Component: FormField },
            { id: 'ba_s2_beneficiary1_mobile', label: '手机号码', Component: FormField },
            { id: 'ba_s2_beneficiary1_officePhone', label: '办公电话号码', Component: FormField },
            { id: 'ba_s2_beneficiary1_email', label: '电邮地址', Component: FormField },
            { id: 'ba_s2_beneficiary1_address', label: '居住地址', Component: FormField },
            { id: 'ba_s3_contacts', title: '此账户第二联系人详情 (最多两位)', personType: '联系人', fieldSet: contactFields, Component: DynamicPersonField, max: 2 },
            { id: 'ba_s4_header', title: 'KYC (了解你的客户) 信息', Component: SectionHeader },
            { id: 'ba_s4_kyc_main_activity', label: '主要业务活动 (如网站, 如有, 请简述)', Component: TextareaField },
            { id: 'ba_s4_kyc_secondary_activity', label: '次要业务活动 (如网站, 如有, 请简述)', Component: TextareaField },
            { id: 'ba_s4_kyc_structure', label: '业务有否涉及多层次结构', Component: TextareaField },
            { id: 'ba_s4_kyc_nominee', label: '是否有任何代持董事/股东?', Component: TextareaField },
            { id: 'ba_s4_kyc_account_purpose', label: '设立在新加波的银行户口主要用途是什么?', Component: TextareaField },
            { id: 'ba_s4_kyc_ubo_background', label: '实益拥有人的背景', Component: TextareaField },
            { id: 'ba_s4_kyc_ubo_wealth_source', label: '实益拥有人的资金来源是什么?', Component: TextareaField },
            { id: 'ba_s4_kyc_director_background', label: '董事的背景', Component: TextareaField },
            { id: 'ba_s4_kyc_related_companies', label: '列出一些列的对应公司/姐妹公司名称', Component: TextareaField },
            { id: 'ba_s4_kyc_staff_count', label: '各地区员工人数', Component: FormField },
            { id: 'ba_s4_kyc_turnover', label: '每年预估营业额', Component: FormField },
            { id: 'ba_s4_kyc_initial_deposit', label: '初始存款 (金额)', Component: FormField },
            { id: 'ba_s4_kyc_fund_source', label: '资金来源', Component: FormField },
            { id: 'ba_s4_kyc_avg_balance', label: '账户预期保持的平均余额', Component: FormField },
            { id: 'ba_s5_customers', label: '主要五大客户 (资金流入来源)', Component: TableField, columns: [
                { key: 'name', header: '买家名称' }, { key: 'location', header: '地点' }, { key: 'product', header: '货品种类' }, { key: 'related', header: '关联公司? (是/否)' }, { key: 'coop_years', header: '合作年限' }, { key: 'payment_method', header: '付款方式' }, { key: 'percentage', header: '占客户总采购额百分比%' },
            ]},
            { id: 'ba_s6_suppliers', label: '主要五大供应商 (资金流出对象)', Component: TableField, columns: [
                { key: 'name', header: '供应商名称' }, { key: 'location', header: '地点' }, { key: 'product', header: '货品种类' }, { key: 'related', header: '关联公司? (是/否)' }, { key: 'coop_years', header: '合作年限' }, { key: 'payment_method', header: '付款方式' }, { key: 'percentage', header: '占客户总采购额百分比%' },
            ]},
            { id: 'ba_s7_inbound_header', title: '每月进账款项资金流 (预计交易的金额和频率):', Component: SectionHeader },
            { id: 'ba_s7_inbound_freq', label: '频率 (笔数)', type: 'number', Component: FormField },
            { id: 'ba_s7_inbound_amount', label: '金额', type: 'number', Component: FormField },
            { id: 'ba_s7_inbound_currency', label: '币种', Component: FormField },
            { id: 'ba_s7_inbound_payers', label: '主要付款方名称 (前五大)', Component: TextareaField },
            { id: 'ba_s7_inbound_purpose', label: '付款目的', Component: TextareaField },
            { id: 'ba_s7_outbound_header', title: '每月出账款项资金流 (预计交易的金额和频率):', Component: SectionHeader },
            { id: 'ba_s7_outbound_freq', label: '频率 (笔数)', type: 'number', Component: FormField },
            { id: 'ba_s7_outbound_amount', label: '金额', type: 'number', Component: FormField },
            { id: 'ba_s7_outbound_currency', label: '币种', Component: FormField },
            { id: 'ba_s7_outbound_payees', label: '主要收款方名称 (前五大)', Component: TextareaField },
            { id: 'ba_s7_outbound_purpose', label: '出款目的', Component: TextareaField },
        ]
    }
].filter(s => s.id !== 'study' && s.id !== 'medical');


// --- 合并表单弹窗组件 ---
const UploadModal = ({ isOpen, onClose, selectedServiceIds, formData, setFormData, setSubmissionStatus }: { isOpen: boolean, onClose: () => void, selectedServiceIds: string[], formData: FormData, setFormData: Dispatch<SetStateAction<FormData>>, setSubmissionStatus: Dispatch<SetStateAction<string>> }) => {
    
    const handleFormChange = (fieldId: string, value: any) => {
        setFormData((prev: FormData) => ({...prev, [fieldId]: value}));
    };
    
    const handleFileChange = (fieldId: string, file: File) => {
         if (file.size > 10 * 1024 * 1024) { // 10MB
            handleFormChange(fieldId, { ...formData[fieldId], error: '文件大小不能超过 10MB' });
        } else {
            handleFormChange(fieldId, { file: file, error: null });
        }
    };
    
    const consolidatedFields = useMemo(() => {
        const fieldMap = new Map();
        selectedServiceIds.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service) {
                service.fields.forEach(field => {
                    const key = field.id;
                    if (!fieldMap.has(key)) {
                        fieldMap.set(key, field);
                    }
                });
            }
        });
        return Array.from(fieldMap.values());
    }, [selectedServiceIds]);

    const handleSubmit = async () => {
        try {
            setSubmissionStatus('loading');
            const submissionId = uuidv4();
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: submissionId,
                    services: selectedServiceIds.map(id => services.find(s => s.id === id)?.title),
                    formData,
                }),
            });

            if (!response.ok) {
                throw new Error('网络响应错误');
            }

            const result = await response.json();
            setSubmissionStatus('success');
            console.log('提交成功:', result);
            onClose();
        } catch (error) {
            setSubmissionStatus('error');
            console.error('提交失败:', error);
        }
    };


    if (!isOpen) return null;

    const renderField = (field: Field) => {
        const { Component, id, ...props } = field;
        
        // --- 特殊字段渲染逻辑 ---
        if (id === 'ha_s3_familyHistory') {
             return(
                 <div key={id}>
                    <CheckboxGroupField {...props} value={formData[id] || []} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const { value, checked } = e.target;
                        const currentValues = formData[id] || [];
                        const newValues = checked ? [...currentValues, value] : currentValues.filter((v: string) => v !== value);
                        handleFormChange(id, newValues);
                    }}/>
                    <AnimatePresence>
                        {formData[id]?.includes('cancer') && 
                            <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}}>
                                <FormField label="癌症部位" placeholder="请填写癌症具体部位" value={formData['ha_s3_cancer_details'] || ''} onChange={(e) => handleFormChange('ha_s3_cancer_details', e.target.value)}/>
                            </motion.div>
                        }
                    </AnimatePresence>
                    <AnimatePresence>
                        {formData[id]?.includes('other') && 
                            <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}}>
                                <FormField label="其他疾病史" placeholder="请填写其他家族疾病史" value={formData['ha_s3_other_details'] || ''} onChange={(e) => handleFormChange('ha_s3_other_details', e.target.value)}/>
                            </motion.div>
                        }
                    </AnimatePresence>
                 </div>
             )
        }
        
        if (id === 'ha_s4_diagnosed') {
             return (
                 <div key={id}>
                    <CheckboxGroupField {...props} value={formData[id] || []} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                         const { value, checked } = e.target;
                         const currentValues = formData[id] || [];
                         const newValues = checked ? [...currentValues, value] : currentValues.filter((v:string) => v !== value);
                         handleFormChange(id, newValues);
                    }}/>
                    <AnimatePresence>
                        {formData[id]?.includes('other') && 
                            <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}}>
                                <FormField label="其他确诊病史" placeholder="请填写其他确诊病史" value={formData['ha_s4_other_details'] || ''} onChange={(e) => handleFormChange('ha_s4_other_details', e.target.value)}/>
                            </motion.div>
                        }
                    </AnimatePresence>
                </div>
             )
        }
        
        if (id === 'is_s1_visa') {
             return(
                 <div key={id}>
                    <SelectField {...props} value={formData[id] || ''} onChange={(e) => handleFormChange(id, e.target.value)}/>
                    <AnimatePresence>
                        {formData[id] === 'yes' &&
                            <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}}>
                                <FormField label="签证类型" placeholder="请填写签证类型" value={formData['is_s1_visa_type'] || ''} onChange={(e) => handleFormChange('is_s1_visa_type', e.target.value)}/>
                            </motion.div>
                        }
                    </AnimatePresence>
                 </div>
             )
        }
        
        // --- 通用字段渲染 ---
        const value = formData[id];
        const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: {name: string, value: string} }) => handleFormChange(id, e.target.value);
        const onMultiChange = (newValue: any) => handleFormChange(id, newValue);

        if (Component === FileUploadField) {
             return <FileUploadField key={id} {...props} onFileChange={(file: File) => handleFileChange(id, file)} fileError={formData[id]?.error}/>;
        }
        if (Component === TableField || Component === DynamicPersonField) {
            return <Component key={id} {...props} value={value || []} onChange={onMultiChange} />;
        }
        if (Component === CheckboxGroupField) {
            const onCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const { value: checkboxValue, checked } = e.target;
                const currentValues = value || [];
                const newValues = checked ? [...currentValues, checkboxValue] : currentValues.filter(v => v !== checkboxValue);
                onMultiChange(newValues);
            };
            return <Component key={id} {...props} value={value || []} onChange={onCheckboxChange} />;
        }
        return <Component key={id} {...props} value={value || ''} onChange={onChange} />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 w-11/12 sm:w-5/6 md:w-4/5 lg:w-3/4 xl:max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">合并资料上传</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                
                <form>
                    {consolidatedFields.map(renderField)}
                </form>

                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                        取消
                    </button>
                    <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        提交
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- 核心动画背景组件 ---
const FloatingPaths = ({ position }: { position: number }) => {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full text-slate-900" viewBox="0 0 696 316" fill="none">
                <title>Floating Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{ pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }}
                        transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
                    />
                ))}
            </svg>
        </div>
    );
}

// --- 主要的 Apex 组件 ---
export default function ApexPage() {
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState<FormData>({});
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSelectService = (serviceId: string) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };
    
    const title = "Apex";
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white py-20 px-4">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />

            <div className="relative z-10 container mx-auto px-2 md:px-6 flex flex-col items-center w-full">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="w-full max-w-4xl mx-auto text-center"
                >
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-12 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span key={wordIndex} className="inline-block mr-2 sm:mr-4 last:mr-0">
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: wordIndex * 0.1 + letterIndex * 0.03, type: "spring", stiffness: 150, damping: 25 }}
                                        className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                </motion.div>
                
                <motion.div 
                    className="w-full max-w-4xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-8">
                        {services.map(service => {
                            const isSelected = selectedServices.includes(service.id);
                            return (
                                <button
                                    key={service.id}
                                    onClick={() => handleSelectService(service.id)}
                                    className={cn(
                                        "p-4 rounded-lg text-center font-semibold transition-all duration-300 transform hover:scale-105 shadow-md border text-sm sm:text-base",
                                        isSelected 
                                            ? "bg-blue-600 text-white border-blue-700 shadow-lg" 
                                            : "bg-white/70 backdrop-blur-sm text-gray-800 border-gray-200/50 hover:bg-white"
                                    )}
                                >
                                    {service.title}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="text-center">
                        <button 
                            onClick={() => { setFormData({}); setModalOpen(true); }}
                            disabled={selectedServices.length === 0}
                            className="bg-green-600 text-white font-bold py-3 px-10 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            生成上传表单
                        </button>
                    </div>
                </motion.div>
            </div>
            
            <AnimatePresence>
                {isModalOpen && (
                    <UploadModal 
                        isOpen={isModalOpen} 
                        onClose={() => setModalOpen(false)} 
                        selectedServiceIds={selectedServices}
                        formData={formData}
                        setFormData={setFormData}
                        setSubmissionStatus={setSubmissionStatus}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {submissionStatus !== 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 right-10 p-4 rounded-lg shadow-lg text-white"
                        style={{ 
                            backgroundColor: submissionStatus === 'success' ? '#28a745' : 
                                             submissionStatus === 'error' ? '#dc3545' : '#007bff'
                        }}
                    >
                        {submissionStatus === 'loading' && '正在提交...'}
                        {submissionStatus === 'success' && '提交成功！'}
                        {submissionStatus === 'error' && '提交失败，请重试。'}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


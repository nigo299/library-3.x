import './index.less'
import 'ant-design-vue/es/grid/style/index.less'
import 'ant-design-vue/es/spin/style/index.less'
import 'ant-design-vue/es/form/style/index.less'

export { formValidator, formGroupsDefiner } from './form.helper'

import * as VueTypes from 'vue-types'
import Normalize from './form.normalize'
import SFormComponent from './index.component'
import { SFormGrid, SFormColItem, SFormColPartItem, SFormRowItem, SFormRowPartItem, SFormGroupItem, SFormGroupPartItem } from './form.declare'
import { Ref, defineComponent, watchEffect, watch, shallowRef, toRaw, unref, ref, readonly, PropType, SetupContext, inject } from 'vue'
import { Rule, NamePath, InternalNamePath, ValidateOptions } from 'ant-design-vue/es/form/interface'
import { defaultConfigProvider } from 'ant-design-vue/es/config-provider'
import AForm, { FormItem as AFormItem } from 'ant-design-vue/es/form'
import ASpin from 'ant-design-vue/es/spin'
import ARow from 'ant-design-vue/es/row'
import ACol from 'ant-design-vue/es/col'
import helper from '@/helper'

interface FormProps {
  grid: SFormGrid;
  model: Record<string, any>;
  border?: string | boolean;
  disabled: boolean;
  readonly: boolean;
}

interface GroupProps {
  group: SFormGroupItem;
}

interface GroupsProps {
  groups: SFormGroupItem[];
}

interface GroupsRules<T> {
  [key: string]: T | T[] | GroupsRules<T>
}

type FormWatchHandler = () => void
type FormItemsHandler = (groups: Array<SFormColPartItem | SFormRowPartItem | SFormGroupPartItem>) => SFormColItem[]
type FormGroupsHandler = (groups: Array<SFormGroupPartItem | SFormRowPartItem | SFormColPartItem>) => SFormGroupItem[]
type FormModelHandler = (item: SFormColItem, options: { first: boolean, oldModel: Record<string, any>, newModel: Record<string, any>, refModel: Ref<Record<string, any>> }) => void
type FormSyncHandler = (item: SFormColItem, options: { syncModel: Record<string, any>, refModel: Ref<Record<string, any>> }) => void

export const SForm = defineComponent({
  name: 'SForm',
  inheritAttrs: false,
  props: {
    rules: {
      type: Object as PropType<GroupsRules<Rule>>,
      default: () => ({})
    },
    grid: VueTypes.object<Partial<SFormGrid>>().def(() => ({})),
    border: VueTypes.any<string | boolean>().def(false),
    groups: VueTypes.array<SFormGroupPartItem | SFormRowPartItem | SFormColPartItem>().def(() => ([])),
    modelValue: VueTypes.object().def(() => undefined),
    model: VueTypes.object().def(() => undefined),
    disabled: VueTypes.bool().def(false),
    readonly: VueTypes.bool().def(false),
    spinning: VueTypes.bool().def(false)
  },
  setup(props, context) {
    const watchHandler: FormWatchHandler = () => {
      const propModel = props.modelValue
      const syncModel = unref(propModel)

      if (syncModel) {
        for (const item of rawItems.value) {
          if (helper.isNotEmptyArray(item.field)) {
            syncHandler(item, { syncModel, refModel })
          }
        }
      }
    }

    const itemsHandler: FormItemsHandler = parts => {
      return (parts.filter(node => node.type !== 'AGroup' && node.type !== 'ARow') as SFormColPartItem[]).map(node => {
        return {
          type: node.type,
          slot: node.slot || Normalize[node.type].slot,
          label: node.label || Normalize[node.type].label,
          field: helper.isArray(node.field) ? node.field : node.field.trim() ? node.field.split('.').filter(t => !!t.trim()) : [],

          grid: node.grid || helper.toDeepClone(Normalize[node.type].grid),
          rules: node.rules || helper.toDeepClone(Normalize[node.type].rules),
          layer: node.layer || helper.toDeepClone(Normalize[node.type].layer),

          props: node.props || helper.toDeepClone(Normalize[node.type].props),
          slots: node.slots || helper.toDeepClone(Normalize[node.type].slots),

          default: {
            input: node?.default?.input || Normalize[node.type].default.input,
            output: node?.default?.output || Normalize[node.type].default.output
          },

          transfer: {
            input: node?.transfer?.input || Normalize[node.type].transfer.input,
            output: node?.transfer?.output || Normalize[node.type].transfer.output
          },

          readonly: node.readonly !== undefined ? node.readonly : Normalize[node.type].readonly,
          disabled: node.disabled !== undefined ? node.disabled : Normalize[node.type].disabled,
          render: node.render !== undefined ? node.render : Normalize[node.type].render,
          show: node.show !== undefined ? node.show : Normalize[node.type].show
        }
      })
    }

    const groupsHandler: FormGroupsHandler = parts => {
      const groups: SFormGroupItem[] = []

      let group: SFormGroupItem = {
        type: 'AGroup',
        grid: {},
        slot: '',
        label: '',
        items: [],
        readonly: false,
        disabled: false,
        render: true,
        show: true
      }

      let row: SFormRowItem = {
        type: 'ARow',
        grid: {},
        items: [],
        readonly: false,
        disabled: false
      }

      for (const node of parts) {
        if (node.type === 'AGroup') {
          group = {
            type: 'AGroup',
            grid: node.grid || group.grid || {},
            slot: node.slot || '',
            label: node.label || '',
            items: [],
            disabled: node.disabled !== undefined ? node.disabled : false,
            readonly: node.disabled !== undefined ? node.disabled : false,
            render: node.render !== undefined ? node.render : true,
            show: node.show !== undefined ? node.show : true
          }

          row = {
            type: 'ARow',
            grid: node.grid || row.grid || group.grid || {},
            items: [],
            readonly: false,
            disabled: false
          }
        }

        if (node.type === 'ARow') {
          row = {
            type: 'ARow',
            grid: node.grid || row.grid || {},
            items: [],
            disabled: node.disabled !== undefined ? node.disabled : false,
            readonly: node.disabled !== undefined ? node.disabled : false
          }
        }

        if (node.type !== 'AGroup' && node.type !== 'ARow') {
          const col = {
            type: node.type,
            slot: node.slot || Normalize[node.type].slot,
            label: node.label || Normalize[node.type].label,
            field: helper.isArray(node.field) ? node.field : node.field.trim() ? node.field.split('.').filter(t => !!t.trim()) : [],

            grid: node.grid || helper.toDeepClone(Normalize[node.type].grid),
            rules: node.rules || helper.toDeepClone(Normalize[node.type].rules),
            layer: node.layer || helper.toDeepClone(Normalize[node.type].layer),

            props: node.props || helper.toDeepClone(Normalize[node.type].props),
            slots: node.slots || helper.toDeepClone(Normalize[node.type].slots),

            default: {
              input: node?.default?.input || Normalize[node.type].default.input,
              output: node?.default?.output || Normalize[node.type].default.output
            },

            transfer: {
              input: node?.transfer?.input || Normalize[node.type].transfer.input,
              output: node?.transfer?.output || Normalize[node.type].transfer.output
            },

            readonly: node.readonly !== undefined ? node.readonly : Normalize[node.type].readonly,
            disabled: node.disabled !== undefined ? node.disabled : Normalize[node.type].disabled,
            render: node.render !== undefined ? node.render : Normalize[node.type].render,
            show: node.show !== undefined ? node.show : Normalize[node.type].show
          }

          row.items.includes(col) || row.items.push(col)
          group.items.includes(row) || group.items.push(row)
          groups.includes(group) || groups.push(group)
        }
      }

      return groups
    }

    const modelHandler: FormModelHandler = (item, options) => {
      const oldModel = options.oldModel
      const newModel = options.newModel
      const refModel = options.refModel

      const defModel = helper.isFunction(item.default.input)
        ? item.default.input({ helper, self: readonly(item) })
        : item.default.input

      let isChanged = options.first
      let tempOldModel: any = oldModel
      let tempNewModel: any = newModel
      let tempRefModel: any = refModel.value

      for (const [index, field] of item.field.entries()) {
        tempOldModel = index === item.field.length - 1 || helper.isObject(tempOldModel?.[field]) ? tempOldModel?.[field] : undefined
        tempNewModel = index === item.field.length - 1 || helper.isObject(tempNewModel?.[field]) ? tempNewModel?.[field] : undefined

        if (!isChanged) {
          isChanged = index < item.field.length - 1
            ? !helper.isObject(tempOldModel) || !helper.isObject(tempNewModel)
            : !helper.toDeepEqual(tempOldModel, tempNewModel)
        }

        if (index < item.field.length - 1) {
          tempRefModel = tempRefModel[field] = helper.isObject(tempRefModel[field]) ? tempRefModel[field] : {}
        }

        if (index === item.field.length - 1) {
          tempRefModel[field] = !isChanged ? tempRefModel[field] : (tempNewModel !== undefined ? tempNewModel : defModel)
          tempRefModel[field] = !isChanged ? tempRefModel[field] : item.transfer.input(tempRefModel[field], { helper, self: readonly(item) })
        }
      }
    }

    const syncHandler: FormSyncHandler = (item, options) => {
      const refModel = options.refModel
      const syncModel = options.syncModel

      const defModel = helper.isFunction(item.default.output)
        ? item.default.output({ helper, self: readonly(item) })
        : item.default.output

      let tempRefModel: any = unref(refModel)
      let tempSyncModel: any = syncModel

      for (const [index, field] of item.field.entries()) {
        if (index < item.field.length - 1) {
          tempSyncModel = helper.isObject(tempSyncModel?.[field]) ? tempSyncModel[field] : (tempSyncModel[field] = {})
          tempRefModel = helper.isObject(tempRefModel?.[field]) ? tempRefModel[field] : (tempRefModel[field] = {})
        }

        if (index === item.field.length - 1) {
          const oldSyncModel = toRaw(tempSyncModel[field])
          const refSyncModel = toRaw(tempRefModel?.[field] !== undefined ? tempRefModel[field] : defModel)
          const newSyncModel = item.transfer.output(refSyncModel, { helper, self: readonly(item) })

          if (!helper.toDeepEqual(oldSyncModel, newSyncModel)) {
            tempSyncModel[field] = newSyncModel
          }

          // when field not in syncModel
          if (tempSyncModel[field] === undefined) {
            tempSyncModel[field] = undefined
          }
        }
      }
    }

    const form: any = ref(null)
    const first: Ref<boolean> = ref(true)
    const rawItems = shallowRef([] as Array<SFormColItem>)
    const rawModel = shallowRef({} as Record<string, any>)
    const refModel: Ref<Record<string, any>> = ref({})
    const refGroups: Ref<SFormGroupItem[]> = ref([])

    const GroupHeaderRender = (opt: FormProps & GroupProps, ctx: SetupContext) => {
      const group = opt.group
      const border = group.border || opt.border
      const disabled = [unref(opt.disabled), unref(group.disabled)].includes(true)
      const readonly = [unref(opt.readonly), unref(group.readonly)].includes(true)
      const className = 's-form-group-item-header-title'
      const slotRender = ctx.slots[group.slot]

      const attrs = {
        border: border !== false && border !== 'no'
          ? undefined
          : 'no'
      }

      if (group.label || group.slot) {
        return (
          <div class='s-form-group-item-header' {...attrs}>
            {
              slotRender
                ? slotRender({ class: className, group, disabled, readonly })
                : <div class='s-form-group-item-header-title'>{group.label}</div>
            }
          </div>
        )
      }

      return <div/>
    }

    const GroupContentRender = (opt: FormProps & GroupProps, ctx: SetupContext) => {
      const handleRowBind = (row: SFormRowItem, group: SFormGroupItem) => {
        return {
          type: row.grid.type || group.grid.type || opt.grid.type,
          align: row.grid.align || group.grid.align || opt.grid.align,
          gutter: row.grid.gutter || group.grid.gutter || opt.grid.gutter,
          justify: row.grid.justify || group.grid.justify || opt.grid.justify
        }
      }

      const handleColBind = (col: SFormColItem, row: SFormRowItem, group: SFormGroupItem) => {
        return {
          span: col.grid.span || row.grid.span || group.grid.span || opt.grid.span,
          pull: col.grid.pull || row.grid.pull || group.grid.pull || opt.grid.pull,
          push: col.grid.push || row.grid.push || group.grid.push || opt.grid.push,
          flex: col.grid.flex || row.grid.flex || group.grid.flex || opt.grid.flex,
          order: col.grid.order || row.grid.order || group.grid.order || opt.grid.order,
          offset: col.grid.offset || row.grid.offset || group.grid.offset || opt.grid.offset,
          xxxl: col.grid.xxxl || row.grid.xxxl || group.grid.xxxl || opt.grid.xxxl,
          xxl: col.grid.xxl || row.grid.xxl || group.grid.xxl || opt.grid.xxl,
          xl: col.grid.xl || row.grid.xl || group.grid.xl || opt.grid.xl,
          lg: col.grid.lg || row.grid.lg || group.grid.lg || opt.grid.lg,
          md: col.grid.md || row.grid.md || group.grid.md || opt.grid.md,
          sm: col.grid.sm || row.grid.sm || group.grid.sm || opt.grid.sm,
          xs: col.grid.xs || row.grid.xs || group.grid.xs || opt.grid.xs
        }
      }

      const handleItemBind = (col: SFormColItem, row: SFormRowItem, group: SFormGroupItem) => {
        const disabled = [
          unref(opt.disabled),
          unref(group.disabled),
          unref(row.disabled),
          helper.isBoolean(unref(col.props.disabled)) ? unref(col.props.disabled) : unref(col.disabled)
        ].includes(true)

        const readonly = [
          unref(opt.readonly),
          unref(group.readonly),
          unref(row.readonly),
          helper.isBoolean(unref(col.props.readonly)) ? unref(col.props.readonly) : unref(col.readonly)
        ].includes(true)

        return {
          ...col.layer,
          'disabled': readonly || disabled,
          'off-disabled': readonly && !disabled || undefined
        }
      }

      const handleStateBind = (col: SFormColItem, row: SFormRowItem, group: SFormGroupItem) => {
        const disabled = [
          unref(opt.disabled),
          unref(group.disabled),
          unref(row.disabled),
          helper.isBoolean(unref(col.props.disabled)) ? unref(col.props.disabled) : unref(col.disabled)
        ].includes(true)

        const readonly = [
          unref(opt.readonly),
          unref(group.readonly),
          unref(row.readonly),
          helper.isBoolean(unref(col.props.readonly)) ? unref(col.props.readonly) : unref(col.readonly)
        ].includes(true)

        return {
          disabled: readonly || disabled
        }
      }

      return (
        <div class='s-form-group-item-content'>
          {
            opt.group.items
              .filter(row => row.items.some(col => unref(col.render)))
              .map(row => (
                <ARow
                  {...handleRowBind(row, opt.group)}
                  v-show={row.items.some(col => unref(col.show))}
                >
                  {
                    row.items
                      .filter(col => unref(col.render))
                      .map(col => {
                        const group = opt.group
                        const disabled = opt.disabled
                        const readonly = opt.readonly
                        const provider = inject('configProvider', defaultConfigProvider)
                        const slotRender = ctx.slots[col.slot]

                        const type = col.type
                        const slots = col.slots
                        const states = handleStateBind(col, row, group)
                        const attrs = Object.fromEntries(Object.entries({ size: provider.componentSize, ...col.props, ...states }).map(([key, value]) => [key, unref(value)]))
                        const source = col.field.slice(0, -1).reduce((model, key) => model[key], opt.model)
                        const field = col.field[col.field.length - 1]

                        return (
                          <ACol
                            v-show={unref(col.show)}
                            {...handleColBind(col, row, group)}
                          >
                            <AFormItem
                              {...handleItemBind(col, row, group)}
                              class='s-form-group-item-template'
                              rules={col.layer.rules || col.rules}
                              label={col.layer.label || col.label}
                              name={col.layer.name || col.field}
                            >
                              {
                                slotRender
                                  ? slotRender({ col, row, group, attrs, slots, disabled, readonly, source, field })
                                  : <SFormComponent type={type} attrs={attrs} v-slots={slots} source={source} field={field}/>
                              }
                            </AFormItem>
                          </ACol>
                        )
                      })
                  }
                </ARow>
              ))
          }
        </div>
      )
    }

    const GroupContainerRender = (opt: FormProps & GroupsProps, ctx: SetupContext) => {
      return (
        <div>
          {
            opt.groups
              .filter(group => unref(group.render))
              .map(group => (
                <div
                  class='s-form-group-container'
                  v-show={unref(group.show)}
                >
                  <GroupHeaderRender
                    group={group}
                    grid={opt.grid}
                    model={opt.model}
                    readonly={opt.readonly}
                    disabled={opt.disabled}
                    v-slots={ctx.slots}
                  />

                  <GroupContentRender
                    group={group}
                    grid={opt.grid}
                    model={opt.model}
                    readonly={opt.readonly}
                    disabled={opt.disabled}
                    v-slots={ctx.slots}
                  />
                </div>
              ))
          }
        </div>
      )
    }

    watch(refModel, watchHandler, { deep: true })

    watchEffect(() => {
      const model = props.modelValue || props.model || {}
      const groups = props.groups
      const oldModel = rawModel.value

      rawModel.value = helper.toDeepClone(model)
      refGroups.value = groupsHandler(groups)
      rawItems.value = itemsHandler(groups)

      for (const item of rawItems.value) {
        if (helper.isNotEmptyArray(item.field)) {
          modelHandler(item, { first: first.value, oldModel, newModel: rawModel.value, refModel })
        }
      }

      first.value = false
    })

    context.expose({
      resetFields: (name?: NamePath) => form.value.resetFields(name),
      clearValidate: (name?: NamePath) => form.value.clearValidate(name),
      scrollToField: (name: NamePath, options?: {}) => form.value.scrollToField(name, options),
      getFieldsValue: (nameList?: InternalNamePath[] | true) => form.value.getFieldsValue(nameList),
      validateFields: (nameList?: NamePath[] | string, options?: ValidateOptions) => form.value.validateFields(nameList, options),
      validate: (nameList?: NamePath[] | string, options?: ValidateOptions) => form.value.validate(nameList, options)
    })

    return () => {
      const grid = ref(props.grid || {})
      const border = ref(props.border || false)
      const disabled = ref(props.disabled || false)
      const readonly = ref(props.readonly || false)
      const spinning = ref(props.spinning || false)

      return (
        <div class='s-form-container'>
          <ASpin spinning={spinning.value}>
            <AForm
              {...context.attrs}
              v-slots={context.slots}
              model={refModel.value}
              rules={props.rules}
              ref={form}
            >
              { context.slots.before?.() }

              <GroupContainerRender
                grid={grid.value}
                border={border.value}
                model={refModel.value}
                groups={refGroups.value}
                disabled={disabled.value}
                readonly={readonly.value}
                v-slots={context.slots}
              />

              { context.slots.after?.() }
            </AForm>
          </ASpin>
        </div>
      )
    }
  }
})

export default SForm

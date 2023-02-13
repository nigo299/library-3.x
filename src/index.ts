import { App } from 'vue'

import { SIcon, isIconType } from './S-Icon/index'
import { SEditCellDatePicker } from './S-EditCell/date-picker'
import { SEditCellTreeSelect } from './S-EditCell/tree-select'
import { SEditCellTextarea } from './S-EditCell/textarea'
import { SEditCellSelect } from './S-EditCell/select'
import { SEditCellInput } from './S-EditCell/input'
import { SIconSelect } from './S-IconSelect/index'
import { SEllipsis } from './S-Ellipsis/index'

export {
  isIconType,
  SEditCellInput,
  SEditCellSelect,
  SEditCellTextarea,
  SEditCellTreeSelect,
  SEditCellDatePicker,
  SIconSelect,
  SEllipsis,
  SIcon
}

export default {
  install(app: App) {
    app.component('SEditCellInput', SEditCellInput)
    app.component('SEditCellSelect', SEditCellSelect)
    app.component('SEditCellTextarea', SEditCellTextarea)
    app.component('SEditCellTreeSelect', SEditCellTreeSelect)
    app.component('SEditCellDatePicker', SEditCellDatePicker)
    app.component('SIconSelect', SIconSelect)
    app.component('SEllipsis', SEllipsis)
    app.component('SIcon', SIcon)
  }
}

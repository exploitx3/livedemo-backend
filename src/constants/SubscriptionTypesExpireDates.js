import moment from 'moment'

export default {
  get pro_monthly()        { return moment().add(30, 'days').toDate() },
  get trial_pro_monthly()  { return moment().add(7, 'days').toDate() },
  get pro_annually()       { return moment().add(1, 'years').toDate() },
  get growth_monthly()     { return moment().add(30, 'days').toDate() },
  get growth_annually()    { return moment().add(1, 'years').toDate() },
}

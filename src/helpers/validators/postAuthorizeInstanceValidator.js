import Joi from '@hapi/joi'

function validateBody(body) {
  const schema = Joi.object({
    instanceId: Joi.string()
      .uuid() // or omit version to allow any UUID
      .required(),
  })

  return schema.validate(body)
}

export default validateBody
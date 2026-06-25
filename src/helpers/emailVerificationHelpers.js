import crypto from 'crypto'
import { sendEmail } from './emails/emailsSender.js'
import Templates from './emails/templates/index.js'
import { EmailVerificationCodeStatuses } from '../models/EmailVerificationCode.js'

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000))
}

function getFirstName(userDoc) {
  const fullNameArray = userDoc.name ? userDoc.name.split(' ') : []
  return fullNameArray.length ? fullNameArray[0] : userDoc.name
}

export async function deactivateCodesForUser(userId, Models) {
  await Models.EmailVerificationCode.updateMany(
    { userId, status: EmailVerificationCodeStatuses.ACTIVE },
    { status: EmailVerificationCodeStatuses.DEACTIVATED }
  )
}

export async function createAndSendEmailVerificationCode(userDoc, Models) {
  await deactivateCodesForUser(userDoc._id, Models)

  const code = generateSixDigitCode()

  const verificationDoc = await new Models.EmailVerificationCode({
    email: userDoc.email,
    userId: userDoc._id,
    code,
    status: EmailVerificationCodeStatuses.ACTIVE,
  }).save()

  const firstName = getFirstName(userDoc)

  await sendEmail(Templates.emailVerification, {
    name: firstName,
    code,
  }, [userDoc.email], Models)
    .catch((err) => {
      console.log('Email verification send error:', err)
    })

  return verificationDoc
}

export async function sendWelcomeEmail(userDoc, Models) {
  const firstName = getFirstName(userDoc)

  if (Templates.newAutoGenAccountCreated) {
    return sendEmail(Templates.newAutoGenAccountCreated, {
      name: firstName,
    }, [userDoc.email], Models)
      .catch((err) => {
        console.log('Welcome email send error:', err)
      })
  }

  return Promise.resolve()
}

export function shouldRedirectToEmailVerify(userDoc) {
  return userDoc?.emailVerified !== true
}

export function shouldRedirectToOnboarding(userDoc) {
  const onboardingGoals = userDoc?.onboarding?.goals
  return !Array.isArray(onboardingGoals) || onboardingGoals.length === 0
}

export function getPostAuthRedirectPath(userDoc) {
  if (shouldRedirectToEmailVerify(userDoc)) {
    return '/email-verify'
  }
  if (shouldRedirectToOnboarding(userDoc)) {
    return '/onboarding'
  }
  return '/'
}

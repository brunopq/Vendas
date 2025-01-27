import type { DomainCampaign } from "../CampaignService"
import SalesService from "../SalesService"

type UserComission = {
  userId: string
  campaigns: {
    campaing: DomainCampaign
    userSellCount: number
    generalComission: number
    userComission: number
    comission: number
  }[]
  totalGeneralComission: number
  totalUserComission: number
  totalComission: number
}

class CalculateUserComissionUseCase {
  async execute(
    userId: string,
    month: number,
    year: number,
  ): Promise<UserComission> {
    const comissions = await SalesService.getCommissionsByMonth(month, year)

    const userSales = await SalesService.getUserSales(month, year, userId)
    const campaignDetails = comissions.map(({ campaign, comission }) => {
      const userSellCount =
        userSales.find((c) => c.campaign.id === campaign.id)?.sellCount || 0

      const generalComission = comission
      const userComission =
        userSellCount * Number.parseInt(campaign.individualPrize)

      return {
        campaing: campaign,
        userSellCount,
        generalComission,
        userComission,
        comission: generalComission + userComission,
      }
    })

    return {
      userId,
      campaigns: campaignDetails,
      totalGeneralComission: campaignDetails.reduce(
        (a, c) => a + c.generalComission,
        0,
      ),
      totalUserComission: campaignDetails.reduce(
        (a, c) => a + c.userComission,
        0,
      ),
      totalComission: campaignDetails.reduce((a, c) => a + c.comission, 0),
    }
  }
}

export default new CalculateUserComissionUseCase()

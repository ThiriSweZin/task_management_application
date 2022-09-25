/**
 * Dashboard View Model
 */
import * as RestApi from "../lib/restapi";

export class DashboardView {
  constructor() { }

  public order(args: any, cb: Function) {
    const data: any = {
      data: []
    };
    RestApi.getKnex()
      .raw("\
        SELECT status,COUNT(*) as count\
        FROM `order` \
        GROUP BY `status`\
        ")
      .then((result) => {
        data.data = result[0];
        return RestApi.getKnex()
                  .raw("\
                SELECT COUNT(*) as count\
                FROM `feedback` \
                WHERE `createddate` = CURDATE() \
                ");
      })
      .then((result) => {
        data.feedback = result[0];
        cb(undefined, data);
      })
      .catch((err) => {
        cb(err, data);
      });
  }
}

export default new DashboardView();
import { EnvironmentRepository } from "@app/repositories/environment.repository";
import { TeamRepository } from "@app/repositories/team.repository";
import { WorkspaceRepository } from "@app/repositories/workspace.repository";
import { EnvironmentService } from "@app/services/environment.service";
import { TeamService } from "@app/services/team.service";
import { WorkspaceService } from "@app/services/workspace.service";
import { throttle } from "$lib/utils/throttle";
import { notifications } from "@library/ui/toast/Toast";
import {
  isGuestUserActive,
  isLoggout,
  isResponseError,
  setUser,
  user,
} from "$lib/store/auth.store";
import { TabRepository } from "@app/repositories/tab.repository";
import {
  RxDB,
  type TeamDocument,
  type WorkspaceDocument,
} from "@app/database/database";
import { currentMonitor, getCurrent } from "@tauri-apps/api/window";
import { clearAuthJwt } from "$lib/utils/jwt";
import { userLogout } from "@app/services/auth.service";
import { FeatureSwitchService } from "@app/services/feature-switch.service";
import { FeatureSwitchRepository } from "@app/repositories/feature-switch.repository";
import { GuestUserRepository } from "@app/repositories/guest-user.repository";
import { v4 as uuidv4 } from "uuid";
import { TeamAdapter } from "@app/adapter";
import { navigate } from "svelte-navigator";
import type { Observable } from "rxjs";
import MixpanelEvent from "$lib/utils/mixpanel/MixpanelEvent";
import { Events } from "$lib/utils/enums";

export class DashboardViewModel {
  constructor() {}
  private teamRepository = new TeamRepository();
  private workspaceRepository = new WorkspaceRepository();
  private teamService = new TeamService();
  private workspaceService = new WorkspaceService();
  private environmentService = new EnvironmentService();
  private environmentRepository = new EnvironmentRepository();
  private tabRepository = new TabRepository();
  private featureSwitchService = new FeatureSwitchService();
  private featureSwitchRepository = new FeatureSwitchRepository();
  private guestUserRepository = new GuestUserRepository();

  public getTeamData = async () => {
    return await this.teamRepository.getTeamData();
  };

  public setOpenTeam = async (teamId) => {
    await this.teamRepository.setOpenTeam(teamId);
  };

  /**
   * Get the active workspace
   * @returns - the active workspace
   */
  public getActiveWorkspace = () => {
    return this.workspaceRepository.getActiveWorkspace();
  };

  /**
   * @description - get environment list from local db
   */
  get environments() {
    return this.environmentRepository.getEnvironment();
  }

  /**
   * @description - get workspace list from local db
   */
  public workspaces = async (): Promise<Observable<WorkspaceDocument[]>> => {
    const workspaces = await this.workspaceRepository.getWorkspaces();
    return workspaces;
  };

  /**
   * @description - get observalble team list from local db
   */
  public getTeams = async (): Promise<Observable<TeamDocument[]>> => {
    return await this.teamRepository.getTeams();
  };

  /**
   *
   * @returns guest user state
   */
  public getGuestUserState = async () => {
    const response = await this.guestUserRepository.findOne({
      name: "guestUser",
    });
    return response?.getLatest().toMutableJSON().isGuestUser;
  };

  /**
   *
   * @returns guest user state
   */
  public updateGuestBannerState = async () => {
    await this.guestUserRepository.updateGuestUserState(
      {
        name: "guestUser",
      },
      {
        isBannerActive: false,
      },
    );
  };

  /**
   * @description - link environment to particular workspace
   * @param workspaceId  - workspace id
   * @param environmentId - environment id
   */
  public initActiveEnvironmentToWorkspace = async (
    workspaceId: string,
    environmentId: string,
  ) => {
    this.workspaceRepository.updateWorkspace(workspaceId, { environmentId });
  };

  // sync teams data with backend server
  public refreshTeams = async (userId: string): Promise<void> => {
    let openTeamId: string = "";
    const teamsData = await this.getTeamData();
    teamsData.forEach((element) => {
      const elem = element.toMutableJSON();
      if (elem.isOpen) openTeamId = elem.teamId;
    });
    const response = await this.teamService.fetchTeams(userId);
    if (response?.isSuccessful && response?.data?.data) {
      const data = response.data.data.map((elem) => {
        const teamAdapter = new TeamAdapter();
        return teamAdapter.adapt(elem).getValue();
      });
      if (openTeamId) {
        data.forEach((elem) => {
          if (elem.teamId === openTeamId) {
            elem.isOpen = true;
          } else {
            elem.isOpen = false;
          }
        });
      } else {
        data[0].isOpen = true;
      }

      await this.teamRepository.bulkInsertData(data);
    }
  };

  public checkActiveWorkspace = async (
    workspaceId: string,
  ): Promise<boolean> => {
    return await this.workspaceRepository.checkActiveWorkspace(workspaceId);
  };

  public activateInitialWorkspaceWithTeam = async (): Promise<void> => {
    const teamIdToActivate =
      await this.workspaceRepository.activateInitialWorkspace();
    if (teamIdToActivate)
      await this.teamRepository.setActiveTeam(teamIdToActivate);
    return;
  };

  // Function to set a workspace as active
  public activateWorkspace = async (id: string): Promise<void> => {
    await this.workspaceRepository.setActiveWorkspace(id);
    return;
  };

  // sync workspace data with backend server
  public refreshWorkspaces = async (userId: string): Promise<void> => {
    const workspaces = await this.workspaceRepository.getWorkspacesDocs();
    const idToEnvironmentMap = {};
    workspaces.forEach((element) => {
      idToEnvironmentMap[element._id] = element?.environmentId;
    });
    const response = await this.workspaceService.fetchWorkspaces(userId);
    let isAnyWorkspaceActive: undefined | string = undefined;
    const data = [];
    const isSuccessful = response?.isSuccessful;
    const res = response?.data?.data;
    if (isSuccessful && res) {
      for (const elem of res) {
        const {
          _id,
          name,
          description,
          users,
          admins,
          team,
          createdAt,
          createdBy,
          collection,
          updatedAt,
          updatedBy,
          isNewInvite,
        } = elem;
        const isActiveWorkspace = await this.checkActiveWorkspace(_id);
        if (isActiveWorkspace) isAnyWorkspaceActive = _id;
        const item = {
          _id,
          name,
          description,
          users,
          collections: collection ? collection : [],
          admins: admins,
          team: {
            teamId: team.id,
            teamName: team.name,
          },
          environmentId: idToEnvironmentMap[_id],
          isActiveWorkspace: isActiveWorkspace,
          createdAt,
          createdBy,
          updatedAt,
          updatedBy,
          isNewInvite,
        };
        data.push(item);
      }
      await this.workspaceRepository.bulkInsertData(data);
      if (!isAnyWorkspaceActive) {
        this.activateInitialWorkspaceWithTeam();
      } else this.activateWorkspace(isAnyWorkspaceActive);
      return;
    }
  };

  private refreshTeamsWorkspacesThrottle = async (_userId: string) => {
    await this.refreshTeams(_userId);
    await this.refreshWorkspaces(_userId);
  };
  private refreshTeamsWorkspacesThrottler = throttle(
    this.refreshTeamsWorkspacesThrottle,
    2000,
  );

  public refreshTeamsWorkspaces = async (_userId: string) => {
    this.refreshTeamsWorkspacesThrottler(_userId);
  };

  public refreshEnvironment = async (workspaceId) => {
    const isGuestUser = await this.getGuestUserState();
    if (isGuestUser !== true) {
      const response =
        await this.environmentService.fetchAllEnvironments(workspaceId);
      if (response.isSuccessful && response.data.data) {
        const environments = response.data.data;
        await this.environmentRepository.refreshEnvironment(
          environments,
          workspaceId,
        );
      }
    }
    return;
  };

  /**
   * clear local DB and clear guest user details from store
   */
  public clearLocalDB = async (): Promise<void> => {
    setUser(null);
    isGuestUserActive.set(false);
    await this.tabRepository.clearTabs();
    await this.guestUserRepository.clearTabs();
    await RxDB.getInstance().destroyDb();
    await RxDB.getInstance().getDb();
    isLoggout.set(true);
    isResponseError.set(false);
    clearAuthJwt();
  };

  /**
   *
   * @returns guest user
   */
  public getGuestUser = async () => {
    const response = await this.guestUserRepository.findOne({
      name: "guestUser",
    });
    return response?.getLatest().toMutableJSON();
  };

  private clientLogout = async (): Promise<void> => {
    setUser(null);
    await this.tabRepository.clearTabs();
    await RxDB.getInstance().destroyDb();
    await RxDB.getInstance().getDb();
    isLoggout.set(true);
    isResponseError.set(false);
    clearAuthJwt();
  };

  // logout to backend - expires jwt - auth and refresh tokens
  public handleLogout = async (): Promise<boolean> => {
    const response = await userLogout();
    if (response.isSuccessful) {
      await this.clientLogout();
      return true;
    } else {
      notifications.error(response.message);
      return false;
    }
  };

  /**
   * Fetch all features from server and save in DB
   */
  public getAllFeatures = async () => {
    const features = await this.featureSwitchService.getAllFeatures();
    if (features.isSuccessful) {
      await this.featureSwitchRepository.bulkInsertData(features.data.data);
    }
  };

  /**
   * add guest user in local db
   */
  public addGuestUser = async () => {
    const data = await this.guestUserRepository.insert({
      id: uuidv4(),
      name: "guestUser",
      isGuestUser: true,
      isBannerActive: true,
    });
  };

  /**
   *
   * @param data query to find details
   * @returns data from guest user repository
   */
  public findUser = async (data) => {
    const res = await this.guestUserRepository.findOne(data);
    return res;
  };

  /**
   * Create workspace in the team
   * @param teamId ID of team where workspace need to be created
   */
  public handleCreateWorkspace = async (
    workspaceName: string,
    teamId: string,
  ) => {
    const response = await this.workspaceService.createWorkspace({
      name: workspaceName,
      id: teamId,
    });
    if (response.isSuccessful && response.data.data) {
      const res = response.data.data;
      await this.workspaceRepository.addWorkspace({
        ...res,
        id: res._id,
      });
      user.subscribe(async (value) => {
        if (value) {
          await this.refreshTeams(value._id);
          await this.refreshWorkspaces(value._id);
        }
      });
      await this.workspaceRepository.setActiveWorkspace(res._id);
      notifications.success("New Workspace Created");
    } else {
      notifications.error(response?.message);
    }
    MixpanelEvent(Events.Create_New_Workspace_TopBar);

    return response;
  };

  /**
   * Switch from one workspace to another
   * @param id - Workspace id
   */
  public handleSwitchWorkspace = async (id: string) => {
    await this.workspaceRepository.setActiveWorkspace(id);
    navigate("/dashboard/collections");
  };
}

export namespace configAPIData {

    export interface WorkspaceConfig {
        elementsPerPage: number;
        theme: string;
        spellcheck: boolean
    }

    export interface DatabaseConnectionConfig {
        connectionString: string;
    }

    export interface ToggleAudio {
        key: string;
        desc: string;
    }

    export interface MoveToTextarea {
        key: string;
        desc: string;
    }

    export interface MoveToSelect {
        key: string;
        desc: string;
    }

    export interface Shortcuts {
        toggle_audio: ToggleAudio;
        move_to_textarea: MoveToTextarea;
        move_to_select: MoveToSelect;
    }

    export interface ApiConfig {
        sourceFolder: string;
        databaseConnectionConfig: DatabaseConnectionConfig;
        shortcuts: Shortcuts;
    }

    export interface FfmpegConstructor {
        ac: number;
        ar: number;
        af: string;
        type: string;
    }

    export interface AudioLengthFilter {
        minLength: number;
        maxLength: number;
        invalidsDir: string;
    }

    export interface ExportType {
        onlyText: boolean;
        optionValue: string;
    }

    export interface LineFormat {
        format: string;
    }

    export interface ConfirmChoices {
        filterByLength: boolean;
        formatAudio: boolean;
    }

    export interface FinalisationRecent {
        ffmpegConstructor: FfmpegConstructor;
        audioLengthFilter: AudioLengthFilter;
        exportType: ExportType;
        lineFormat: LineFormat;
        confirmChoices: ConfirmChoices;
    }

    export interface RootObject {
        workspaceConfig: WorkspaceConfig;
        apiConfig: ApiConfig;
        finalisationRecent: FinalisationRecent;
    }

}
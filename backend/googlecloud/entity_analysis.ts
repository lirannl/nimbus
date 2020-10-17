import { Cve } from "../interfaces/cve_interface";
import language from "@google-cloud/language";
import { google } from "@google-cloud/language/build/protos/protos";
import { removeNulls } from "../utils";

const client = new language.LanguageServiceClient();

/**
 *  Packs text into an entity analysis request
 *  @param text The text to analyse
 */
const textPacker: (text: string) => google.cloud.language.v1.IAnalyzeEntitiesRequest =
    text => ({
        document: {
            content: text,
            type: "PLAIN_TEXT",
        }
    });

/**
 * Returns a version of the provided cve with analysed entities
 * @param cve The cve to analyse
 */
const analysedCve = async (cve: Cve) => {
    const [{ entities }] = await client.analyzeEntities(textPacker(cve.summary));
    if (!entities || entities.length == 0) return null;
    return Object.assign(cve, { entities: entities });
};

const analyseCves = async (cves: Cve[]) => removeNulls(await Promise.all(cves.map(analysedCve)));

export default analyseCves;
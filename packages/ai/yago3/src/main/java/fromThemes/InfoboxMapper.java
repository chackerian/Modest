/*
This class is part of the YAGO project at the Max Planck Institute
for Informatics/Germany and Télécom ParisTech University/France:
http://yago-knowledge.org

This class is copyright 2016 Farzaneh Mahdisoltani, with contributions from Fabian M. Suchanek.

YAGO is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published
by the Free Software Foundation, either version 3 of the License,
or (at your option) any later version.

YAGO is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public
License for more details.

You should have received a copy of the GNU General Public License
along with YAGO.  If not, see <http://www.gnu.org/licenses/>.
*/

package fromThemes;

import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import basics.Fact;
import basics.FactComponent;
import basics.FactSource;
import basics.RDFS;
import extractors.MultilingualExtractor;
import followUp.FollowUpExtractor;
import followUp.Redirector;
import followUp.TypeChecker;
import fromOtherSources.PatternHardExtractor;
import javatools.administrative.D;
import javatools.datatypes.FinalSet;
import javatools.parsers.Char17;
import utils.FactCollection;
import utils.MultilingualTheme;
import utils.Theme;

/**
 * Maps the facts in the output of InfoboxExtractor for different languages.
 * 
*/

public class InfoboxMapper extends MultilingualExtractor {

  public static final MultilingualTheme INFOBOXFACTS = new MultilingualTheme("infoboxFacts", "Facts of infobox, redirected and type-checked");

  public static final MultilingualTheme INFOBOXFACTS_TOREDIRECT = new MultilingualTheme("infoboxFactsToRedirect",
      "Facts of infobox to be redirected and type-checked");

  public static final MultilingualTheme INFOBOXFACTS_TOTYPECHECK = new MultilingualTheme("infoboxFactsToCheck",
      "Facts of infobox to be type-checked");

  public static final MultilingualTheme INFOBOXSOURCES = new MultilingualTheme("infoboxSources", "Sources of infobox facts");

  @Override
  public Set<FollowUpExtractor> followUp() {
    return new FinalSet<FollowUpExtractor>(
        new Redirector(INFOBOXFACTS_TOREDIRECT.inLanguage(language), INFOBOXFACTS_TOTYPECHECK.inLanguage(language), this),
        new TypeChecker(INFOBOXFACTS_TOTYPECHECK.inLanguage(language), INFOBOXFACTS.inLanguage(language), this));
  }

  @Override
  public Set<Theme> input() {
    if (isEnglish()) {
      return (new FinalSet<>(PatternHardExtractor.INFOBOXPATTERNS, InfoboxTermExtractor.INFOBOXTERMS.inLanguage(language)));
    } else {
      return (new FinalSet<>(AttributeMatcher.MATCHED_INFOBOXATTS.inLanguage(language),
          InfoboxTermExtractor.INFOBOXTERMSTRANSLATED.inLanguage(language)));
    }
  }

  @Override
  public Set<Theme> output() {
    return new HashSet<>(Arrays.asList(INFOBOXFACTS_TOREDIRECT.inLanguage(language), INFOBOXSOURCES.inLanguage(language)));
  }

  @Override
  public void extract() throws Exception {

    FactCollection infoboxAttributeMappings;
    FactSource input;
    // Get the infobox patterns depending on the language
    if (isEnglish()) {
      infoboxAttributeMappings = PatternHardExtractor.INFOBOXPATTERNS.factCollection();
      input = InfoboxTermExtractor.INFOBOXTERMS.inLanguage(language);
    } else {
      infoboxAttributeMappings = AttributeMatcher.MATCHED_INFOBOXATTS.inLanguage(language).factCollection();
      input = InfoboxTermExtractor.INFOBOXTERMSTRANSLATED.inLanguage(language);
    }
    Map<String, Set<String>> attribute2relations = new HashMap<>();
    for (Fact f : infoboxAttributeMappings.getFactsWithRelation("<_infoboxPattern>")) {
      if (RDFS.nothing.equals(f.getObject())) {
        continue;
      }
      D.addKeyValue(attribute2relations, f.getSubject().toLowerCase(), f.getObject(), HashSet.class);
    }
    for (Fact f : input) {
      Set<String> relations = attribute2relations.get(f.getRelation().toLowerCase());
      if (relations == null) continue;
      for (String relation : relations) {
        Fact fact;
        if (relation.endsWith("->")) {
          relation = Char17.cutLast(Char17.cutLast(relation)) + '>';
          fact = new Fact(f.getObject(), relation, f.getSubject());
        } else {
          fact = new Fact(f.getSubject(), relation, f.getObject());
        }
        // Since the TermExtractor extracts everything also as a string,
        // we get subjects that are strings. This is always wrong.
        if (FactComponent.isLiteral(f.getSubject())) continue;
        write(INFOBOXFACTS_TOREDIRECT.inLanguage(language), fact, INFOBOXSOURCES.inLanguage(language),
            FactComponent.wikipediaSourceURL(f.getSubject(), language), "InfoboxMapper from " + f.getRelation());
      }
    }

  }

  public InfoboxMapper(String lang) {
    super(lang);
  }

  public static void main(String[] args) throws Exception {
    InfoboxMapper extractor = new InfoboxMapper("en");
    extractor.extract(new File("/home/jbiega/data/yago2s/"), "mapping infobox attributes into infobox facts");
  }

}

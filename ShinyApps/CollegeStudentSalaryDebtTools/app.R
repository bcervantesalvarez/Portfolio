library(shiny)
library(tidyverse)
library(showtext)
library(ggtext)
library(RColorBrewer)
library(rsconnect)
library(colorspace)
library(plotly)
library(shinyWidgets)
library(scales)
library(ggplot2)

#read the files in from github
allAgesDf <- read_csv("https://raw.githubusercontent.com/bcervantesalvarez/Portfolio/main/posts/CollegeStudent_Debt_Tool/all-ages.csv")
tuition_cost <- read_csv("https://raw.githubusercontent.com/bcervantesalvarez/Portfolio/main/posts/CollegeStudent_Debt_Tool/tuition_income.csv")
tuition <- read_csv("https://raw.githubusercontent.com/bcervantesalvarez/Portfolio/main/posts/CollegeStudent_Debt_Tool/tuition_cost.csv")
ds4<-read_csv("https://raw.githubusercontent.com/bcervantesalvarez/Portfolio/main/posts/CollegeStudent_Debt_Tool/salary_and_stats.csv")

#Wrangling Salary Potential
salary <- allAgesDf %>% 
  dplyr::select(Major, P25th, Median, P75th) %>% 
  pivot_longer(c(P25th, Median, P75th),
               names_to = "Percentile_Range", values_to = "Salary") %>%
  arrange(Major) %>%
  mutate(Percentile_Range = as.factor(Percentile_Range),
         Major = as.factor(Major))

#Wrangling Potential Tuition Burden
tuition_cost <- tuition_cost %>% 
  filter(year == 2018 & net_cost > 0) %>%
  arrange(name) %>%
  mutate(income_lvl = as.factor(income_lvl),
         name = as.factor(name))

tuition_cost$income_lvl <- recode(tuition_cost$income_lvl, 
                                  "0 to 30,000" = "$0 to $30,000",
                                  "30,001 to 48,000" = "$30,001 to $48,000",
                                  "48_001 to 75,000" = "$48,001 to $75,000",
                                  "75,001 to 110,000" = "$75,001 to $110,000",
                                  "Over 110,000" = "Over $110,000")
salary$Percentile_Range <- factor(salary$Percentile_Range, levels = c("P25th", "Median", "P75th"))
salary$Percentile_Range <- recode(salary$Percentile_Range, 
                                  "P25th" = "Early Career",
                                  "Median" = "Middle Career",
                                  "P75th" = "Late Career")
salary$Major <- str_to_title(salary$Major)
salary$Major <- gsub("And", "and", salary$Major)
df <- tuition %>% 
  group_by(state, degree_length, type) %>% filter(!is.na(state) & degree_length != "Other") %>%
  summarise(room_expenses = mean(room_and_board, na.rm = TRUE),
            inStateTotal = mean(in_state_total, na.rm = TRUE),
            outOfStateTotal = mean(out_of_state_total, na.rm = TRUE))
df$degree_length <- as.factor(df$degree_length)
df$type <- as.factor(df$type)

df <- df %>% rename("Room and Board" = room_expenses,
                    "In State Tuition" = inStateTotal,
                    "Out of State Tuition" = outOfStateTotal)

# Define UI for application that draws a histogram
ui <- navbarPage("Salary and College Tuition Tool For High School Students",
                 
                 #FIRST TAB
                 tabPanel("Salary Estimator",
                          sidebarLayout(
                            sidebarPanel(
                              #For 1st Plot
                              selectInput("selectInput1", label = "Choose your major:", 
                                          choices = unique(salary$Major),
                                          selected = "ART HISTORY AND CRITICISM"),
                              checkboxGroupInput("percentile_choice", label = "Pick your career level:", 
                                                 choices = list("Early Career " = "Early Career",
                                                                "Middle Career " = "Middle Career",
                                                                "Late Career " = "Late Career"),
                                                 selected = c("Early Career", "Middle Career", "Late Career")),
                            ),
                            # Show a plot of the generated distribution
                            mainPanel(
                              plotOutput("Plot"),
                            )
                          )
                 ),
                 
                 #SECOND TAB
                 tabPanel("Tuition Estimator",
                          sidebarLayout(
                            sidebarPanel(
                              #For 2nd Plot
                              selectInput("money", label = "Select the type of expense:",
                                          choices = c("Room and Board" = "Room and Board",
                                                      "In State Tuition" = "In State Tuition",
                                                      "Out of State Tuition" = "Out of State Tuition"),
                                          selected = "In State Tuition"),
                              selectInput("state", label = "Pick your State:", 
                                          choices = unique(df$state),
                                          selected = "Oregon"),
                            ),
                            # Show a plot of the generated distribution
                            mainPanel(
                              plotOutput("Plot2"),
                            )
                          )
                 ),
                 #THIRD TAB
                 tabPanel("Debt Estimator",
                          sidebarLayout(
                            sidebarPanel(
                              #For 3rd Plot
                              selectInput("selectInput2", 
                                          label = "Select your university:",
                                          choices = unique(tuition_cost$name), 
                                          selected = "Willamette University"),
                              checkboxGroupInput("checkGroup", 
                                                 label = "Select your household income bracket:", 
                                                 choices = list("$0 to $30,000" = "$0 to $30,000",
                                                                "$30,001 to $48,000" = "$30,001 to $48,000",
                                                                "$48,001 to $75,000" = "$48,001 to $75,000",
                                                                "$75,001 to $110,000" = "$75,001 to $110,000",
                                                                "Over $110,000" = "Over $110,000"),
                                                 selected = c("$0 to $30,000",
                                                              "$30,001 to $48,000",
                                                              "$48,001 to $75,000",
                                                              "$75,001 to $110,000",
                                                              "Over $110,000")),
                            ),
                            # Show a plot of the generated distribution
                            mainPanel(
                              plotOutput("Plot3"),
                            )
                          )
                 ),
                 
                 #FOURTH TAB
                 tabPanel("Debt Calculator",
                          sidebarLayout(
                            sidebarPanel(
                              selectInput("major_category", 
                                          label = "Pick a major category:", 
                                          choices = unique(ds4$major_category),
                                          selected = "Computers & Mathematics"),
                            ),
                            
                            mainPanel(
                              plotOutput("Plot4"),
                              plotOutput("Plot5")
                            )
                          )
                 )
)
# Define server logic required to draw a histogram
server <- function(input, output) {
  showtext_auto()
  
  #vars  
  title = 25
  subtitle = 20
  facet_title = 25
  axis_title = 18
  tick_numbers = 13
  title_color = "black"
    background = "gainsboro"
      plot_background = "gainsboro"
        facet_header_background = "gainsboro"
          line_type = "solid"
          
          CoreyPlotTheme <- theme(
            text = element_text(family = "Futura"),
            #background color of page
            plot.background = element_rect(fill = background),
            
            #graph background and grid
            panel.background = element_blank(),
            panel.grid.major = element_line(size = .1, linetype = line_type, colour = "gainsboro"), 
            panel.grid.minor = element_line(size = .1, linetype = line_type, colour = "black"),
            
            #title/font/labels
            plot.title = element_text(color = title_color, size = title,family = "Futura",hjust = 0.5),
            plot.subtitle = element_text(color = title_color, size = subtitle,family = "Futura", hjust = 0.5),
            #plot.caption = element_textbox_simple(halign = 0, size = tick_numbers, maxwidth = 30,family = "Futura"),
            plot.caption = element_text(color = title_color, face = "bold", size = tick_numbers, family = "Futura", hjust=0),
            strip.text = element_text(color = title_color,size = facet_title, family = "Futura"),
            strip.background = element_rect(fill = facet_header_background),
            
            #tick marks
            axis.text = element_text(color = title_color, size = tick_numbers, family = "Futura"),
            axis.title = element_text(color = title_color, size = axis_title, family = "Futura"),
            axis.ticks.x = element_blank(),
            
            #legend
            legend.title = element_text(color = title_color,size =subtitle, family = "Futura"),
            legend.background = element_rect(fill = plot_background),
            legend.text = element_text(size = tick_numbers, family ="Futura" )
          )
          
          
          #First Plot
          output$Plot <- renderPlot({
            salary %>% 
              filter((Major %in% input$selectInput1) & (Percentile_Range %in% input$percentile_choice)) %>% 
              ggplot(aes(x = Percentile_Range, y = Salary, fill = Percentile_Range)) +
              geom_col(width = 0.4, color = "black", show.legend = FALSE) +
              geom_label(aes(y = Salary,
                             label = print(paste0("$", round(Salary/1000, 2), "K"))),
                         show.legend = FALSE,
                         size = 7,
                         family = "Futura",
                         fill = "white") +
              scale_y_continuous(labels = label_number(prefix = "$", suffix = "K", scale = 1e-3)) +
              labs(x = NULL,
                   y = NULL,
                   title = paste0("Estimated Salary for ", input$selectInput1),
                   caption = "Source: TuitionTracker.org @ 2018") + 
              CoreyPlotTheme +
              scale_fill_brewer(palette = "PuBuGn")
          })
          
          #Second Plot
          output$Plot2 <- renderPlot({
            df %>% filter(state == input$state) %>%
              ggplot(aes(x = degree_length, y = .data[[input$money]], fill = degree_length)) +
              geom_col(width = 0.4, color = "black", show.legend = FALSE) +
              facet_wrap(~type) + 
              geom_label(aes(y = .data[[input$money]],
                             label = print(paste0("$", round(.data[[input$money]]/1000, 2), "K"))),
                         family = "Futura",
                         size = 7,
                         show.legend = FALSE,
                         fill = "white") +
              scale_y_continuous(labels = label_number(prefix = "$", suffix = "K", scale = 1e-3),
                                 limits = c(0,55000)) +
              labs(x = NULL,
                   y = NULL,
                   title = paste0("Average ", input$money, " for ", input$state, " Universities"),
                   subtitle = "For Undergraduate Degrees",
                   caption = "Source: TuitionTracker.org @ 2018") + 
              CoreyPlotTheme +
              scale_fill_brewer(palette = "PuBuGn")
          })
          
          #Third Plot
          output$Plot3 <- renderPlot({
            tuition_cost %>% 
              filter((income_lvl %in% input$checkGroup) & (name %in% input$selectInput2)) %>%
              ggplot(aes(x = income_lvl, y = net_cost, fill = income_lvl)) +
              geom_col(color = "black", width = 0.4, position = "dodge", show.legend = FALSE) +
              geom_label(aes(y = net_cost,
                             label = print(paste0("$", round(net_cost/1000, 2), "K"))),
                         family = "Futura",
                         size = 7,
                         show.legend = FALSE,
                         fill = "white") +
              scale_y_continuous(labels = label_number(prefix = "$", suffix = "K", scale = 1e-3)) +
              labs(x = NULL,
                   y = NULL,
                   title = paste0("Median Student Loan Debt for ", input$selectInput2),
                   subtitle = "After Completing Their Undergraduate Degree",
                   caption = "Source: TuitionTracker.org @ 2018") +
              CoreyPlotTheme + 
              scale_fill_brewer(palette = "PuBuGn")
          })
          
          #Fourth Plot
          output$Plot4 <- renderPlot({
            ds4 %>% 
              filter(major_category == input$major_category) %>% 
              ggplot(aes(perfect_payback_period,reorder(major, perfect_payback_period), fill = perfect_payback_period))+
              geom_col(show.legend = FALSE) +
              geom_label(aes(label=paste(round(perfect_payback_period,2)," yrs.")), 
                         show.legend = FALSE, 
                         fill = "white", 
                         hjust = 1.1) +
              theme(axis.title.y = element_blank(),
                    axis.text.x = element_blank()) +
              labs(title = 'How Long Will You Be In Debt?',
                   subtitle = "Based on Your Major",
                   x = 'Time to pay off loans')+
              CoreyPlotTheme +
              theme(plot.title = element_text(hjust = 0.5)) +
              scale_fill_continuous_sequential("PuBuGn")
          })
          
          #Fifth Plot
          output$Plot5 <- renderPlot({
            
            ds4 %>%
              filter(major_category != input$major_category) %>%
              ggplot(aes(x = median_salary, y = ..count.., fill = major_category))+
              stat_density(show.legend = FALSE, alpha = .3, color = NA)+
              stat_density(data = (ds4 %>% filter(major_category==input$major_category)),show.legend = FALSE, 
                           aes(x= median_salary), fill = "seagreen4", color = NA)+
              labs(title = 'How Does Your Salary Stack Up Against The Other Major Categories?',
                   subtitle = 'Distribution Of Salaries From Each Major',
                   x = 'Salary (USD)')+
              scale_x_continuous(labels = label_number(prefix = "$", suffix = "K", scale = 1e-3),
                                 limits = c(0, 120000)) +
              scale_fill_discrete_sequential("PuBuGn") +
              CoreyPlotTheme +
              theme(axis.text.y = element_blank(),
                    axis.title.y = element_blank(),
                    axis.ticks.y = element_blank())
          })
          
}
# Run the application 
shinyApp(ui = ui, server = server)